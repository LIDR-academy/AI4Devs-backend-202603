import { Request, Response } from 'express';
import {
    getCandidatesByPosition,
    KanbanServiceError,
    updateCandidateStage,
} from '../../application/services/kanbanService';

const parsePositiveInteger = (value: unknown): number | null => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return null;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return null;
    }

    return parsedValue;
};

const isKanbanServiceError = (error: unknown): error is KanbanServiceError => {
    return error instanceof KanbanServiceError;
};

const handleKanbanError = (error: unknown, res: Response) => {
    if (isKanbanServiceError(error)) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
};

export const getPositionCandidates = async (req: Request, res: Response) => {
    const positionId = parsePositiveInteger(req.params.id);

    if (!positionId) {
        return res.status(400).json({ message: 'Invalid position ID' });
    }

    try {
        const result = await getCandidatesByPosition(req.prisma, positionId);
        return res.status(200).json(result);
    } catch (error) {
        return handleKanbanError(error, res);
    }
};

export const updateCandidateStageController = async (req: Request, res: Response) => {
    const candidateId = parsePositiveInteger(req.params.id);
    const positionId = parsePositiveInteger(req.body?.positionId);
    const interviewStepId = parsePositiveInteger(req.body?.interviewStepId);

    if (!candidateId) {
        return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    if (!positionId) {
        return res.status(400).json({ message: 'Invalid position ID' });
    }

    if (!interviewStepId) {
        return res.status(400).json({ message: 'Invalid interview step ID' });
    }

    try {
        const result = await updateCandidateStage(req.prisma, candidateId, positionId, interviewStepId);
        return res.status(200).json(result);
    } catch (error) {
        return handleKanbanError(error, res);
    }
};
