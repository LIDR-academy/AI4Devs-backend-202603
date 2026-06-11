import prisma from '../../infrastructure/database/prismaClient';

export const calculateAverageScore = (scores: (number | null)[]): number | null => {
    const valid = scores.filter((s): s is number => s !== null);
    if (valid.length === 0) return null;
    return valid.reduce((sum, s) => sum + s, 0) / valid.length;
};

export const getCandidatesByPosition = async (positionId: number) => {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: { select: { firstName: true, lastName: true } },
            interviewStep: { select: { name: true } },
            interviews: { select: { score: true } },
        },
    });

    return applications.map((app) => ({
        fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentInterviewStep: app.interviewStep.name,
        averageScore: calculateAverageScore(app.interviews.map((i) => i.score)),
    }));
};
