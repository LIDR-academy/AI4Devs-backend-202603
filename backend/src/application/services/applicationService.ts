import { PrismaClient } from '@prisma/client';

export async function updateCandidateStage(
    applicationId: number,
    interviewStepId: number,
) {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
        throw { status: 400, message: 'Invalid application id' };
    }

    if (!Number.isInteger(interviewStepId) || interviewStepId <= 0) {
        throw { status: 400, message: 'interviewStepId must be a positive integer' };
    }

    const prisma = new PrismaClient();

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { position: { select: { interviewFlowId: true } } },
    });

    if (!application) {
        throw { status: 404, message: 'Application not found' };
    }

    const step = await prisma.interviewStep.findUnique({
        where: { id: interviewStepId },
    });

    if (!step) {
        throw { status: 400, message: 'Interview step not found' };
    }

    if (step.interviewFlowId !== application.position.interviewFlowId) {
        throw { status: 409, message: "Interview step does not belong to the position's interview flow" };
    }

    return prisma.application.update({
        where: { id: applicationId },
        data: { currentInterviewStep: interviewStepId },
    });
}
