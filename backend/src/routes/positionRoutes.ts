import { Router } from 'express';
import { getCandidatesByPositionController } from '../presentation/controllers/candidateController';

const router = Router();

/**
 * GET /positions/:id/candidates
 * Obtiene los candidatos en proceso para una determinada posición
 * Retorna: nombre completo, fase actual, puntuación media de entrevistas
 */
router.get('/:id/candidates', getCandidatesByPositionController);

export default router;
