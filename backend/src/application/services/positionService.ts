import prisma from '../../infrastructure/prismaClient';

export interface CandidateInPosition {
    candidateId: number;
    fullName: string;
    currentInterviewStep: { id: number; name: string };
    averageScore: number | null;
}

export const getCandidatesByPosition = async (positionId: number): Promise<CandidateInPosition[]> => {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: { select: { id: true, firstName: true, lastName: true } },
            interviewStep: { select: { id: true, name: true } },
            interviews: { select: { score: true } },
        },
    });

    return applications.map((app) => {
        const scores = app.interviews.map((i) => i.score).filter((s): s is number => s !== null);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

        return {
            candidateId: app.candidate.id,
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: {
                id: app.interviewStep.id,
                name: app.interviewStep.name,
            },
            averageScore,
        };
    });
};
