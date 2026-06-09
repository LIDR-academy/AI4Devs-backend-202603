import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage } from '../../application/services/candidateService';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const result = await addCandidate(req.body);
        res.status(201).send(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send({ message: error.message });
        } else {
            res.status(500).send({ message: 'An unexpected error occurred' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const idStr = req.params.id;
        if (!/^[1-9]\d*$/.test(idStr)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const id = Number(idStr);
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
    const idStr = req.params.id;
    if (!/^[1-9]\d*$/.test(idStr)) {
        return res.status(400).json({ error: 'Invalid candidate ID format' });
    }
    const candidateId = Number(idStr);

    const { applicationId, currentInterviewStep } = req.body;
    if (
        typeof applicationId !== 'number' ||
        !Number.isInteger(applicationId) ||
        typeof currentInterviewStep !== 'number' ||
        !Number.isInteger(currentInterviewStep)
    ) {
        return res.status(400).json({ error: 'applicationId and currentInterviewStep must be integers' });
    }

    try {
        const result = await updateCandidateStage(candidateId, applicationId, currentInterviewStep);
        return res.status(200).json(result);
    } catch (error: any) {
        if (error.status === 404) {
            return res.status(404).json({ error: error.message });
        }
        if (error.status === 400) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

