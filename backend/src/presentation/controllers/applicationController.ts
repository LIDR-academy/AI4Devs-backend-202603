import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/applicationService';

export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const interviewStepId = parseInt(req.body.currentInterviewStep);

        if (isNaN(id) || isNaN(interviewStepId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await updateCandidateStage(id, interviewStepId);
        return res.status(200).json({ message: 'Stage updated successfully', data: result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Application not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Interview step not found') {
                return res.status(400).json({ error: error.message });
            }
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
