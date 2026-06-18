import { PrismaClient } from '@prisma/client';
import { Application } from '../../domain/models/Application';

const prisma = new PrismaClient();

export interface CandidateKanbanItem {
    applicationId: number;
    candidateId: number;
    fullName: string;
    currentInterviewStep: {
        id: number;
        name: string;
        orderIndex: number;
    };
    averageScore: number | null;
}

const calculateAverageScore = (scores: (number | null)[]): number | null => {
    const validScores = scores.filter((s): s is number => s !== null);
    if (validScores.length === 0) return null;
    const avg = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
    return Math.round(avg * 100) / 100;
};

export const getCandidatesByPosition = async (positionId: number): Promise<CandidateKanbanItem[]> => {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position) {
        const error: any = new Error('Posición no encontrada');
        error.code = 'NOT_FOUND';
        throw error;
    }

    const applications = await Application.findByPositionId(positionId);

    return applications.map((app) => ({
        applicationId: app.id,
        candidateId: app.candidateId,
        fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentInterviewStep: {
            id: app.interviewStep.id,
            name: app.interviewStep.name,
            orderIndex: app.interviewStep.orderIndex,
        },
        averageScore: calculateAverageScore(app.interviews.map((i) => i.score)),
    }));
};
