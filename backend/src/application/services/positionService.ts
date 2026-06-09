import prisma from '../../infrastructure/prismaClient';

export type PositionCandidateResult = {
  applicationId: number;
  candidateId: number;
  fullName: string;
  currentInterviewStep: { id: number; name: string };
  averageScore: number | null;
};

export const getPositionCandidates = async (
  positionId: number
): Promise<PositionCandidateResult[]> => {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      applications: {
        select: {
          id: true,
          candidateId: true,
          candidate: { select: { firstName: true, lastName: true } },
          interviewStep: { select: { id: true, name: true } },
          interviews: { select: { score: true } },
        },
      },
    },
  });

  if (!position) {
    const err: any = new Error('Position not found');
    err.status = 404;
    throw err;
  }

  return position.applications.map((app) => {
    const scoredInterviews = app.interviews.filter((i) => i.score !== null);
    const averageScore =
      scoredInterviews.length > 0
        ? scoredInterviews.reduce((sum, i) => sum + (i.score as number), 0) /
          scoredInterviews.length
        : null;

    return {
      applicationId: app.id,
      candidateId: app.candidateId,
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      currentInterviewStep: app.interviewStep,
      averageScore,
    };
  });
};
