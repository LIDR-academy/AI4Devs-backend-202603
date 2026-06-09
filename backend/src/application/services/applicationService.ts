import { PrismaClient } from '@prisma/client';

export const updateApplicationStage = async (
  prisma: PrismaClient,
  applicationId: number,
  currentInterviewStep: number,
) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const interviewStep = await prisma.interviewStep.findUnique({
    where: { id: currentInterviewStep },
  });

  if (!interviewStep) {
    throw new Error('Interview step not found');
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: { currentInterviewStep },
  });

  return {
    id: updated.id,
    candidateId: updated.candidateId,
    positionId: updated.positionId,
    currentInterviewStep: {
      id: interviewStep.id,
      name: interviewStep.name,
    },
  };
};
