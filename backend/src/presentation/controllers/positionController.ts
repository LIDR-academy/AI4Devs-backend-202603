import { Request, Response } from 'express';
import { getPositionCandidates } from '../../application/services/positionService';

export const getPositionCandidatesController = async (req: Request, res: Response) => {
  const idStr = req.params.id;
  if (!/^[1-9]\d*$/.test(idStr)) {
    return res.status(400).json({ error: 'Invalid position ID format' });
  }
  const id = Number(idStr);

  try {
    const candidates = await getPositionCandidates(id);
    return res.status(200).json(candidates);
  } catch (error: any) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
