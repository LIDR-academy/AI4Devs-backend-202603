import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStage,
    CANDIDATE_NOT_FOUND,
    APPLICATION_NOT_FOUND,
    STEP_FLOW_MISMATCH,
} from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * PUT /candidates/:id/stage
 * Updates the current interview stage of a candidate's application.
 */
export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        // Strict integer validation: parseInt would accept "12abc".
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ message: 'Invalid candidate ID' });
        }
        const candidateId = parseInt(req.params.id, 10);

        const { applicationId, currentInterviewStep } = req.body ?? {};
        if (!Number.isInteger(applicationId)) {
            return res
                .status(400)
                .json({ message: 'applicationId is required and must be an integer' });
        }
        if (!Number.isInteger(currentInterviewStep)) {
            return res.status(400).json({
                message: 'currentInterviewStep is required and must be an integer',
            });
        }

        const updated = await updateCandidateStage(
            req.prisma,
            candidateId,
            applicationId,
            currentInterviewStep
        );

        return res.status(200).json({
            message: 'Candidate stage updated successfully',
            data: updated,
        });
    } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === CANDIDATE_NOT_FOUND) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        if (code === APPLICATION_NOT_FOUND) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (code === STEP_FLOW_MISMATCH) {
            return res.status(400).json({
                message: "Interview step does not belong to this position's flow",
            });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export { addCandidate };