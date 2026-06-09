import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage } from '../../application/services/candidateService';

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

export { addCandidate };

export const updateStageController = async (req: Request, res: Response) => {
    const candidateId = parseInt(req.params.id);
    if (isNaN(candidateId) || candidateId <= 0) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const { applicationId, currentInterviewStep } = req.body;
    if (
        applicationId === undefined ||
        currentInterviewStep === undefined ||
        typeof applicationId !== 'number' ||
        typeof currentInterviewStep !== 'number'
    ) {
        return res.status(400).json({ error: 'applicationId and currentInterviewStep are required and must be numbers' });
    }

    try {
        const updated = await updateCandidateStage(candidateId, applicationId, currentInterviewStep);
        return res.status(200).json({ message: 'Stage updated successfully', data: updated });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'Candidate not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Application not found or does not belong to this candidate') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes("does not belong to this position's interview flow")) {
                return res.status(400).json({ error: error.message });
            }
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};