import { Router } from 'express';
import { getCandidatesInProcessByPositionId } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesInProcessByPositionId);

export default router;
