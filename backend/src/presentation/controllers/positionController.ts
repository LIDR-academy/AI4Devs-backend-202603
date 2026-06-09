import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

export const getPositionCandidatesController = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid position ID' });
    }

    try {
        const candidates = await getCandidatesByPosition(id);
        return res.status(200).json(candidates);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Position not found') {
            return res.status(404).json({ error: 'Position not found' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
