import prisma from '../../infrastructure/database/prismaClient';

export const updateCandidateStage = async (applicationId: number, interviewStepId: number) => {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
        throw new Error('Application not found');
    }

    const interviewStep = await prisma.interviewStep.findUnique({ where: { id: interviewStepId } });
    if (!interviewStep) {
        throw new Error('Interview step not found');
    }

    return prisma.application.update({
        where: { id: applicationId },
        data: { currentInterviewStep: interviewStepId },
        select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
    });
};
