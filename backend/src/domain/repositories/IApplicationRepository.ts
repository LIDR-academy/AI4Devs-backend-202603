export interface IApplicationRepository {
    findById(id: number): Promise<{ id: number; positionId: number; candidateId: number; currentInterviewStep: number } | null>;
    updateStage(applicationId: number, interviewStepId: number): Promise<{ id: number; candidateId: number; positionId: number; currentInterviewStep: number }>;
    findInterviewStepById(id: number): Promise<{ id: number; name: string } | null>;
}
