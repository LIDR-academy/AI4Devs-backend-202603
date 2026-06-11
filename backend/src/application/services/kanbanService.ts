import { PrismaClient } from '@prisma/client';

export class KanbanServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'KanbanServiceError';
        this.statusCode = statusCode;
    }
}

type CurrentInterviewStepDTO = {
    id: number;
    name: string;
    orderIndex: number;
};

type PositionCandidateDTO = {
    application_id: number;
    candidate_id: number;
    candidate_full_name: string;
    current_interview_step: CurrentInterviewStepDTO;
    average_score: number | null;
};

type PositionCandidatesResponseDTO = {
    position_id: number;
    candidates: PositionCandidateDTO[];
};

type UpdateCandidateStageDTO = {
    candidate_id: number;
    position_id: number;
    application_id: number;
    current_interview_step: CurrentInterviewStepDTO;
};

const getAverageScore = (scores: Array<number | null>): number | null => {
    const validScores = scores.filter((score): score is number => score !== null);

    if (validScores.length === 0) {
        return null;
    }

    const total = validScores.reduce((sum, score) => sum + score, 0);
    return total / validScores.length;
};

export const getCandidatesByPosition = async (
    prisma: PrismaClient,
    positionId: number,
): Promise<PositionCandidatesResponseDTO> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true },
    });

    if (!position) {
        throw new KanbanServiceError('Position not found', 404);
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        orderBy: [
            {
                interviewStep: {
                    orderIndex: 'asc',
                },
            },
            {
                interviewStep: {
                    id: 'asc',
                },
            },
            {
                id: 'asc',
            },
        ],
        select: {
            id: true,
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            interviewStep: {
                select: {
                    id: true,
                    name: true,
                    orderIndex: true,
                },
            },
            interviews: {
                select: {
                    score: true,
                },
            },
        },
    });

    return {
        position_id: position.id,
        candidates: applications.map((application) => ({
            application_id: application.id,
            candidate_id: application.candidate.id,
            candidate_full_name: `${application.candidate.firstName} ${application.candidate.lastName}`,
            current_interview_step: {
                id: application.interviewStep.id,
                name: application.interviewStep.name,
                orderIndex: application.interviewStep.orderIndex,
            },
            average_score: getAverageScore(application.interviews.map((interview) => interview.score)),
        })),
    };
};

export const updateCandidateStage = async (
    prisma: PrismaClient,
    candidateId: number,
    positionId: number,
    interviewStepId: number,
): Promise<UpdateCandidateStageDTO> => {
    const applications = await prisma.application.findMany({
        where: {
            candidateId,
            positionId,
        },
        select: {
            id: true,
            candidateId: true,
            positionId: true,
            position: {
                select: {
                    interviewFlowId: true,
                },
            },
        },
    });

    if (applications.length === 0) {
        throw new KanbanServiceError('Application not found for candidate and position', 404);
    }

    if (applications.length > 1) {
        throw new KanbanServiceError('Multiple applications found for candidate and position', 409);
    }

    const application = applications[0];
    const interviewStep = await prisma.interviewStep.findUnique({
        where: { id: interviewStepId },
        select: {
            id: true,
            name: true,
            orderIndex: true,
            interviewFlowId: true,
        },
    });

    if (!interviewStep) {
        throw new KanbanServiceError('Interview step not found', 404);
    }

    if (interviewStep.interviewFlowId !== application.position.interviewFlowId) {
        throw new KanbanServiceError('Interview step does not belong to the position interview flow', 422);
    }

    const updatedApplication = await prisma.application.update({
        where: { id: application.id },
        data: { currentInterviewStep: interviewStep.id },
        select: {
            id: true,
            candidateId: true,
            positionId: true,
            interviewStep: {
                select: {
                    id: true,
                    name: true,
                    orderIndex: true,
                },
            },
        },
    });

    return {
        candidate_id: updatedApplication.candidateId,
        position_id: updatedApplication.positionId,
        application_id: updatedApplication.id,
        current_interview_step: {
            id: updatedApplication.interviewStep.id,
            name: updatedApplication.interviewStep.name,
            orderIndex: updatedApplication.interviewStep.orderIndex,
        },
    };
};
