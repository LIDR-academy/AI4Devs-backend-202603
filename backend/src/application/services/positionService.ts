import { PrismaClient } from '@prisma/client';

/**
 * Shape returned for each candidate in process for a position.
 * Mirrors the `PositionCandidate` schema in api-spec.yaml.
 */
export interface PositionCandidate {
    fullName: string;
    currentInterviewStep: string;
    candidateId: number;
    applicationId: number;
    averageScore: number;
}

/**
 * Error code set on the thrown Error when the requested position does not exist.
 * The controller inspects `error.code` to map the failure to a 404 response,
 * matching the existing convention (see candidateService.ts `error.code`).
 */
export const POSITION_NOT_FOUND = 'POSITION_NOT_FOUND';

/** Builds the "position not found" error carrying the POSITION_NOT_FOUND code. */
export const positionNotFoundError = (): Error => {
    const error = new Error('Position not found');
    (error as Error & { code?: string }).code = POSITION_NOT_FOUND;
    return error;
};

/**
 * Returns all candidates currently in process for the given position,
 * one row per application, shaped for a kanban-style UI.
 *
 * @param prisma  Prisma client attached to the request (req.prisma).
 * @param positionId  Position identifier.
 * @throws Error with code POSITION_NOT_FOUND when the position does not exist.
 */
export const getPositionCandidates = async (
    prisma: PrismaClient,
    positionId: number
): Promise<PositionCandidate[]> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
    });

    if (!position) {
        throw positionNotFoundError();
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: true,
            interviewStep: true,
            interviews: true,
        },
    });

    return applications.map((application) => {
        const scoredInterviews = application.interviews.filter(
            (interview) => interview.score !== null && interview.score !== undefined
        );

        const averageScore =
            scoredInterviews.length > 0
                ? scoredInterviews.reduce(
                      (sum, interview) => sum + (interview.score as number),
                      0
                  ) / scoredInterviews.length
                : 0;

        return {
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            currentInterviewStep: application.interviewStep.name,
            candidateId: application.candidate.id,
            applicationId: application.id,
            averageScore,
        };
    });
};
