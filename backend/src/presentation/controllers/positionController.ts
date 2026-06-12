import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

export const getPositionCandidates = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id, 10);

        if (isNaN(positionId)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const candidates = await getCandidatesByPositionId(positionId);
        res.json(candidates);
    } catch (error) {
        if (error instanceof Error && error.message === 'Position not found') {
            return res.status(404).json({ error: error.message });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};
