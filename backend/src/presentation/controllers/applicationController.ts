import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/applicationService';

export async function updateCandidateStageController(
    req: Request<{ id: string }, {}, { interviewStepId: number }>,
    res: Response,
): Promise<void> {
    try {
        const applicationId = parseInt(req.params.id, 10);
        const { interviewStepId } = req.body;

        const result = await updateCandidateStage(applicationId, interviewStepId);
        res.status(200).json(result);
    } catch (error: any) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message ?? 'Internal server error' });
    }
}
