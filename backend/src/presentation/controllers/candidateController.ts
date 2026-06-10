import { Request, Response } from 'express';
import {
    addCandidate,
    findCandidateById,
    updateCandidateStage,
    CandidateNotFoundError,
    ApplicationNotFoundError,
    AmbiguousApplicationError,
    InvalidStageError,
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
 * Moves a candidate to a new Kanban stage (interview step).
 */
export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id, 10);
        if (isNaN(candidateId) || candidateId <= 0) {
            return res.status(400).json({ error: 'Invalid candidate ID format' });
        }

        const { newStage, positionId } = req.body ?? {};

        if (typeof newStage !== 'string' || newStage.trim().length === 0) {
            return res.status(400).json({ error: 'newStage is required and must be a non-empty string' });
        }

        let parsedPositionId: number | undefined;
        if (positionId !== undefined && positionId !== null) {
            parsedPositionId = parseInt(positionId, 10);
            if (isNaN(parsedPositionId) || parsedPositionId <= 0) {
                return res.status(400).json({ error: 'Invalid positionId format' });
            }
        }

        const updated = await updateCandidateStage(
            req.prisma,
            candidateId,
            newStage,
            parsedPositionId,
        );

        return res.status(200).json({
            message: 'Candidate stage updated successfully',
            data: updated,
        });
    } catch (error) {
        if (error instanceof CandidateNotFoundError || error instanceof ApplicationNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        if (error instanceof InvalidStageError) {
            return res.status(400).json({ error: error.message, validStages: error.validStages });
        }
        if (error instanceof AmbiguousApplicationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error updating candidate stage:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };