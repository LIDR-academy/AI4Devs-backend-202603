import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PositionCandidate {
    candidateId: number;
    fullName: string;
    current_interview_step: number;
    averageScore: number | null;
}

export const getCandidatesByPositionId = async (positionId: number): Promise<PositionCandidate[]> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
    });

    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: true,
            interviews: {
                select: { score: true },
            },
        },
    });

    return applications.map((application) => {
        const scores = application.interviews
            .map((interview) => interview.score)
            .filter((score): score is number => score !== null);

        const averageScore =
            scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;

        return {
            candidateId: application.candidateId,
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            current_interview_step: application.currentInterviewStep,
            averageScore,
        };
    });
};
