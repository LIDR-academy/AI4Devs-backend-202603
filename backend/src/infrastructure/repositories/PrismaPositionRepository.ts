import prisma from '../database/prismaClient';
import { IPositionRepository } from '../../domain/repositories/IPositionRepository';

export class PrismaPositionRepository implements IPositionRepository {
    async findById(id: number): Promise<{ id: number } | null> {
        return prisma.position.findUnique({ where: { id }, select: { id: true } });
    }

    async findCandidatesWithScores(positionId: number): Promise<Array<{
        fullName: string;
        currentInterviewStep: string;
        averageScore: number | null;
    }>> {
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: { select: { firstName: true, lastName: true } },
                interviewStep: { select: { name: true } },
                interviews: { select: { score: true } },
            },
        });

        return applications.map((app) => {
            const scores = app.interviews.map((i) => i.score).filter((s): s is number => s !== null);
            const averageScore = scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : null;
            return {
                fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
                currentInterviewStep: app.interviewStep.name,
                averageScore,
            };
        });
    }
}
