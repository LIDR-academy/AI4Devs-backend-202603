import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage as updateCandidateStageService } from '../../application/services/candidateService';

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

export const updateCandidateStage = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await updateCandidateStageService(id, req.body);
        res.json(result);
    } catch (error: unknown) {
        if (error instanceof Error) {
            const message = error.message;
            if (
                message === 'Candidate not found' ||
                message === 'Position not found' ||
                message === 'Application not found'
            ) {
                return res.status(404).json({ error: message });
            }
            if (message.startsWith('Invalid') || message.includes('interview flow')) {
                return res.status(400).json({ error: message });
            }
        }
        res.status(500).json({ error: 'Internal Server Error' });
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

export { addCandidate };