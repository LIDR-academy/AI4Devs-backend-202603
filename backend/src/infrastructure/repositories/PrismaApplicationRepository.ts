import prisma from '../database/prismaClient';
import { IApplicationRepository } from '../../domain/repositories/IApplicationRepository';

export class PrismaApplicationRepository implements IApplicationRepository {
    async findById(id: number) {
        return prisma.application.findUnique({
            where: { id },
            select: { id: true, positionId: true, candidateId: true, currentInterviewStep: true },
        });
    }

    async findInterviewStepById(id: number) {
        return prisma.interviewStep.findUnique({ where: { id }, select: { id: true, name: true } });
    }

    async updateStage(applicationId: number, interviewStepId: number) {
        return prisma.application.update({
            where: { id: applicationId },
            data: { currentInterviewStep: interviewStepId },
            select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
        });
    }
}
