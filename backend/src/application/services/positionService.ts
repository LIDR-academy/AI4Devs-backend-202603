import { PrismaClient } from '@prisma/client';

export const getCandidatesByPosition = async (prisma: PrismaClient, positionId: number) => {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error('Position not found');
  }

  const applications = await prisma.application.findMany({
    where: { positionId },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      interviewStep: {
        select: {
          name: true,
        },
      },
      interviews: {
        select: {
          score: true,
        },
      },
    },
  });

  const candidates = applications.map((app) => {
    const scores = app.interviews
      .map((i) => i.score)
      .filter((s): s is number => s !== null);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;

    return {
      candidateId: app.candidate.id,
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.interviewStep.name,
      averageScore: averageScore !== null ? Math.round(averageScore * 100) / 100 : null,
    };
  });

  return {
    positionId: position.id,
    positionTitle: position.title,
    candidates,
  };
};
