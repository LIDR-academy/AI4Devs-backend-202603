import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    const result = await getCandidatesByPositionId(id, req.prisma);

    if (result === null) {
      res.status(404).json({ error: 'Position not found' });
      return;
    }

    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
