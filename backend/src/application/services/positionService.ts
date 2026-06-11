import { PrismaClient } from '@prisma/client';

export interface PositionCandidateDto {
  fullName: string;
  currentInterviewStep: string;
  candidateId: number;
  applicationId: number;
  averageScore: number | null;
}

export function calculateAverageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length;
  return Math.round(avg * 10) / 10;
}

type ApplicationWithRelations = {
  id: number;
  candidate: { id: number; firstName: string; lastName: string };
  interviewStep: { name: string };
  interviews: { score: number | null }[];
};

export function mapApplicationToDto(application: ApplicationWithRelations): PositionCandidateDto {
  return {
    fullName: `${application.candidate.firstName.trim()} ${application.candidate.lastName.trim()}`,
    currentInterviewStep: application.interviewStep.name,
    candidateId: application.candidate.id,
    applicationId: application.id,
    averageScore: calculateAverageScore(application.interviews.map((i) => i.score)),
  };
}

export async function getCandidatesByPositionId(
  positionId: number,
  prisma: PrismaClient,
): Promise<PositionCandidateDto[] | null> {
  const position = await prisma.position.findUnique({ where: { id: positionId } });
  if (!position) return null;

  const applications = await prisma.application.findMany({
    where: { positionId },
    orderBy: { applicationDate: 'asc' },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true } },
      interviewStep: { select: { name: true } },
      interviews: { select: { score: true } },
    },
  });

  return applications.map(mapApplicationToDto);
}
