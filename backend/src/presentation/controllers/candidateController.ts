import { Request, Response } from 'express';
import { addCandidate, findCandidateById, getCandidatesByPosition, updateCandidateStage } from '../../application/services/candidateService';

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
 * Controlador para obtener candidatos de una posición específica
 * GET /positions/:id/candidates
 */
export const getCandidatesByPositionController = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        if (isNaN(positionId)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        // Verificar que la posición existe
        const position = await req.prisma.position.findUnique({
            where: { id: positionId }
        });

        if (!position) {
            return res.status(404).json({ error: 'Position not found' });
        }

        const candidates = await getCandidatesByPosition(positionId);
        res.status(200).json({
            message: 'Candidates retrieved successfully',
            data: candidates,
            total: candidates.length
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

/**
 * Controlador para actualizar la fase de un candidato
 * PUT /candidates/:id/stage
 */
export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const candidateId = parseInt(req.params.id);
        const { newStageId } = req.body;

        if (isNaN(candidateId)) {
            return res.status(400).json({ error: 'Invalid candidate ID format' });
        }

        if (!newStageId || isNaN(newStageId)) {
            return res.status(400).json({ error: 'newStageId is required and must be a valid number' });
        }

        // Verificar que el candidato existe
        const candidate = await req.prisma.candidate.findUnique({
            where: { id: candidateId }
        });

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const result = await updateCandidateStage(candidateId, newStageId);
        res.status(200).json({
            message: 'Candidate stage updated successfully',
            data: result
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export { addCandidate };