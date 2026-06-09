import { Request, Response } from 'express';
import {
    getPositionCandidates,
    POSITION_NOT_FOUND,
} from '../../application/services/positionService';

/**
 * GET /positions/:id/candidates
 * Returns all candidates in process for a given position.
 */
export const getPositionCandidatesController = async (req: Request, res: Response) => {
    try {
        // Strict integer validation: parseInt would accept "12abc".
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ message: 'Invalid position ID' });
        }

        const id = parseInt(req.params.id, 10);
        const candidates = await getPositionCandidates(req.prisma, id);
        return res.status(200).json(candidates);
    } catch (error) {
        if ((error as { code?: string }).code === POSITION_NOT_FOUND) {
            return res.status(404).json({ message: 'Position not found' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};
