import { Request, Response } from 'express';
import { getPositionCandidates } from '../../application/services/positionService';

export const getPositionCandidatesController = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const candidates = await getPositionCandidates(id);
    res.status(200).json(candidates);
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ message: error.message });
    if (error.status === 400) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
