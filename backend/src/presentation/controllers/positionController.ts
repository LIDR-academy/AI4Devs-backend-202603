import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPositionController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid position ID format' });
    }

    const result = await getCandidatesByPosition(req.prisma, id);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Position not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
