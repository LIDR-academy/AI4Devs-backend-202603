export interface IPositionRepository {
    findById(id: number): Promise<{ id: number } | null>;
    findCandidatesWithScores(positionId: number): Promise<Array<{
        fullName: string;
        currentInterviewStep: string;
        averageScore: number | null;
    }>>;
}
