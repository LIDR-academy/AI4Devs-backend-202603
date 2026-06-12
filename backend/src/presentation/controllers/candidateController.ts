import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStage,
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

export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id, 10);

        if (isNaN(candidateId)) {
            return res.status(400).json({ error: 'Invalid candidate ID format' });
        }

        const currentInterviewStep =
            req.body.currentInterviewStep ?? req.body.current_interview_step;
        const positionId = req.body.positionId ?? req.body.position_id;

        if (currentInterviewStep === undefined || positionId === undefined) {
            return res.status(400).json({
                error: 'currentInterviewStep and positionId are required',
            });
        }

        const parsedStep = parseInt(String(currentInterviewStep), 10);
        const parsedPositionId = parseInt(String(positionId), 10);

        if (isNaN(parsedStep) || isNaN(parsedPositionId)) {
            return res.status(400).json({ error: 'Invalid stage or position ID format' });
        }

        const application = await updateCandidateStage(candidateId, parsedStep, parsedPositionId);
        res.json({
            message: 'Candidate stage updated successfully',
            data: application,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (
                error.message === 'Candidate not found' ||
                error.message === 'Interview step not found' ||
                error.message === 'Application not found for this candidate and position'
            ) {
                return res.status(404).json({ error: error.message });
            }
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };