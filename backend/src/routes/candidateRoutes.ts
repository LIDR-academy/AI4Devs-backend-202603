import { Router } from 'express';
import { addCandidateController, getCandidateById, updateCandidateStageController } from '../presentation/controllers/candidateController';

const router = Router();

router.post('/', addCandidateController);

router.get('/:id', getCandidateById);

router.put('/:id/stage', updateCandidateStageController);

export default router;
