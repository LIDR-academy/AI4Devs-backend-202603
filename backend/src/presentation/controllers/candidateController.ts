import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateApplicationStage } from '../../application/services/candidateService';

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

export const updateCandidateStage = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'El ID de la postulación debe ser un número entero positivo' });
    }

    const { newInterviewStepId } = req.body;
    if (newInterviewStepId === undefined || newInterviewStepId === null) {
        return res.status(400).json({ error: 'El campo newInterviewStepId es requerido y debe ser un número entero positivo' });
    }
    const stepId = parseInt(newInterviewStepId);
    if (isNaN(stepId) || stepId <= 0) {
        return res.status(400).json({ error: 'El campo newInterviewStepId es requerido y debe ser un número entero positivo' });
    }

    try {
        const result = await updateApplicationStage(id, stepId);
        return res.status(200).json({ message: 'Etapa actualizada correctamente', data: result });
    } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
            return res.status(404).json({ error: error.message });
        }
        if (error.code === 'VALIDATION_ERROR') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export { addCandidate };