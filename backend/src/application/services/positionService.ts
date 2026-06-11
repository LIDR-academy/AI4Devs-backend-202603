import { PrismaClient } from '@prisma/client';

export const getPositionCandidates = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw { status: 400, message: 'Invalid position id' };
  }

  const prisma = new PrismaClient();
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          interviewStep: { select: { name: true } },
          interviews: { select: { score: true } },
        },
      },
    },
  });

  if (!position) {
    throw { status: 404, message: 'Position not found' };
  }

  return position.applications.map((app: any) => {
    const numericScores = app.interviews
      .map((i: any) => i.score)
      .filter((s: any) => s !== null && s !== undefined) as number[];

    const averageScore =
      numericScores.length > 0
        ? numericScores.reduce((sum: number, s: number) => sum + s, 0) / numericScores.length
        : null;

    return {
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.interviewStep.name,
      averageScore,
    };
  });
};
