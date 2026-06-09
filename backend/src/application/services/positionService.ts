import { Position } from '../../domain/models/Position';

// DTO de salida para cada candidato en proceso de una posición.
export interface CandidateInProcess {
    candidateId: number;
    applicationId: number;
    fullName: string;
    currentInterviewStep: number;
    stepName: string;
    averageScore: number | null;
}

// Calcula la media de los scores no nulos. Devuelve null si no hay scores.
const calculateAverageScore = (interviews: { score: number | null }[]): number | null => {
    const scores = interviews
        .map((interview) => interview.score)
        .filter((score): score is number => score !== null && score !== undefined);

    if (scores.length === 0) {
        return null;
    }

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
};

// Recupera todos los candidatos en proceso (aplicaciones) de una posición.
// Lanza un Error con mensaje 'Position not found' si la posición no existe.
export const getCandidatesByPosition = async (positionId: number): Promise<CandidateInProcess[]> => {
    const position = await Position.findOne(positionId);
    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await Position.findApplicationsWithCandidates(positionId);

    return applications.map((application) => ({
        candidateId: application.candidate.id,
        applicationId: application.id,
        fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
        currentInterviewStep: application.currentInterviewStep,
        stepName: application.interviewStep.name,
        averageScore: calculateAverageScore(application.interviews),
    }));
};
