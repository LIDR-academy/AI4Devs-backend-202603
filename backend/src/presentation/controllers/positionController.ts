import { Request, Response } from 'express';
import {
    getCandidatesByPositionId,
    PositionNotFoundError,
} from '../../application/services/positionService';

/**
 * GET /positions/:id/candidates
 * Returns every candidate in process for the given position.
 */
export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id, 10);
        if (isNaN(positionId) || positionId <= 0) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const candidates = await getCandidatesByPositionId(req.prisma, positionId);
        return res.status(200).json(candidates);
    } catch (error) {
        if (error instanceof PositionNotFoundError) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error retrieving candidates for position:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
