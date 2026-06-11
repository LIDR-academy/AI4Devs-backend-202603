import { Request, Response } from 'express';
import { getCandidatesInProcess } from '../../application/services/positionService';

export const getCandidatesInProcessByPositionId = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await getCandidatesInProcess(id);
        if (!result) {
            return res.status(404).json({ error: 'Position not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
