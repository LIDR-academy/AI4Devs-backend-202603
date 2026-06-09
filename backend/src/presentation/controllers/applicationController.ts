import { Request, Response } from 'express';
import { updateApplicationStage } from '../../application/services/applicationService';

export const updateApplicationStageController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid application ID format' });
    }

    const { currentInterviewStep } = req.body;
    if (!currentInterviewStep || !Number.isInteger(currentInterviewStep)) {
      return res.status(400).json({ error: 'currentInterviewStep must be a valid integer' });
    }

    const result = await updateApplicationStage(req.prisma, id, currentInterviewStep);

    res.json({
      message: 'Application stage updated successfully',
      application: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Application not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Interview step not found') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
