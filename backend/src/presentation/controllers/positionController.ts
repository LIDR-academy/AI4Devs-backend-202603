import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPositionController = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'El ID de la posición debe ser un número entero positivo' });
    }

    try {
        const candidates = await getCandidatesByPosition(id);
        return res.status(200).json(candidates);
    } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
