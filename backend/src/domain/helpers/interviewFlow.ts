export interface StepRef {
    id: number;
    orderIndex: number;
}

/**
 * Given all steps of an interview flow and the current step id,
 * returns the next step (lowest orderIndex strictly above the current one).
 * Returns null when currentStepId is the last step or is not found in the list.
 */
export const getNextInterviewStep = (
    steps: StepRef[],
    currentStepId: number
): StepRef | null => {
    const current = steps.find(s => s.id === currentStepId);
    if (!current) return null;

    const candidates = steps.filter(s => s.orderIndex > current.orderIndex);
    if (candidates.length === 0) return null;

    return candidates.reduce((min, s) => s.orderIndex < min.orderIndex ? s : min);
};
