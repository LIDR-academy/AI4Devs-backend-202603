import { Position } from '../../domain/models/Position';

const calculateAverageScore = (interviews: { score: number | null }[]): number | null => {
    const scores = interviews
        .map((interview) => interview.score)
        .filter((score): score is number => score !== null);

    if (scores.length === 0) {
        return null;
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 10) / 10;
};

export const getCandidatesInProcess = async (positionId: number) => {
    const position = await Position.findCandidatesInProcess(positionId);

    if (!position) {
        return null;
    }

    const candidates = position.applications.map((application) => ({
        candidateId: application.candidate.id,
        fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        currentInterviewStep: {
            id: application.interviewStep.id,
            name: application.interviewStep.name,
            orderIndex: application.interviewStep.orderIndex,
        },
        averageScore: calculateAverageScore(application.interviews),
    }));

    return {
        positionId: position.id,
        candidates,
    };
};
