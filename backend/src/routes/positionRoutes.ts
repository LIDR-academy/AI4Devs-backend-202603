import { Router } from 'express';
import { getPositionCandidatesController } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getPositionCandidatesController);

export default router;
