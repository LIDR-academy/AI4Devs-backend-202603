import { PrismaClient } from '@prisma/client';

export interface CandidateInProcess {
    candidateId: number;
    applicationId: number;
    fullName: string;
    /** Raw value of the `current_interview_step` FK on the application. */
    currentInterviewStep: number;
    /** Human-readable name of the current interview step. */
    currentInterviewStepName: string;
    averageScore: number | null;
}

/**
 * Error thrown when a referenced position does not exist. The controller maps
 * this to a 404 response, keeping HTTP concerns out of the service layer.
 */
export class PositionNotFoundError extends Error {
    constructor(positionId: number) {
        super(`Position with id ${positionId} not found`);
        this.name = 'PositionNotFoundError';
        // Required so `instanceof` works under the project's ES5 target.
        Object.setPrototypeOf(this, PositionNotFoundError.prototype);
    }
}

/**
 * Retrieve every candidate currently in process for a given position.
 *
 * Strategy (2 queries, no N+1):
 *   1. Fetch the position's applications with the candidate and current step.
 *   2. Fetch every interview score for those candidates across ALL of their
 *      applications, then aggregate per candidate.
 *
 * The average is computed **per candidate across all their applications** (as
 * specified: "AVG of all scores from interview table for this candidate"), not
 * scoped to this position's application. Candidates with no scored interviews
 * get `null`. The result is rounded to two decimals.
 *
 * @throws {PositionNotFoundError} when the position does not exist.
 */
export const getCandidatesByPositionId = async (
    prisma: PrismaClient,
    positionId: number,
): Promise<CandidateInProcess[]> => {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
        throw new PositionNotFoundError(positionId);
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: { select: { firstName: true, lastName: true } },
            interviewStep: { select: { id: true, name: true } },
        },
    });

    if (applications.length === 0) {
        return [];
    }

    const candidateIds = Array.from(new Set(applications.map((app) => app.candidateId)));

    // All scored interviews for these candidates, regardless of which
    // application/position they belong to.
    const interviews = await prisma.interview.findMany({
        where: {
            score: { not: null },
            application: { candidateId: { in: candidateIds } },
        },
        select: {
            score: true,
            application: { select: { candidateId: true } },
        },
    });

    // Aggregate sum/count of scores per candidate.
    const aggregates = new Map<number, { total: number; count: number }>();
    for (const interview of interviews) {
        const candidateId = interview.application.candidateId;
        const current = aggregates.get(candidateId) ?? { total: 0, count: 0 };
        current.total += interview.score as number;
        current.count += 1;
        aggregates.set(candidateId, current);
    }

    return applications.map((app) => {
        const aggregate = aggregates.get(app.candidateId);
        const averageScore =
            aggregate && aggregate.count > 0
                ? Math.round((aggregate.total / aggregate.count) * 100) / 100
                : null;

        return {
            candidateId: app.candidateId,
            applicationId: app.id,
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.id,
            currentInterviewStepName: app.interviewStep.name,
            averageScore,
        };
    });
};
