import { Router } from 'express';
import { updateApplicationStageController } from '../presentation/controllers/applicationController';

const router = Router();

router.put('/:id/stage', updateApplicationStageController);

export default router;
