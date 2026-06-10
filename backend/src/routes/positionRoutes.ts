import { Router } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';
import { authenticate } from '../presentation/middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /positions/{id}/candidates:
 *   get:
 *     summary: Get all candidates in process for a position
 *     description: >
 *       Returns every candidate currently in process for the given position,
 *       including their full name, current interview step (FK id + name) and the
 *       average of all their interview scores across all of their applications
 *       (null when they have no scored interviews), rounded to two decimals.
 *     tags:
 *       - Positions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the position.
 *     responses:
 *       200:
 *         description: Array of candidates in process (may be empty).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   candidateId:
 *                     type: integer
 *                     example: 1
 *                   applicationId:
 *                     type: integer
 *                     example: 12
 *                   fullName:
 *                     type: string
 *                     example: John Doe
 *                   currentInterviewStep:
 *                     type: integer
 *                     description: FK value of application.current_interview_step.
 *                     example: 2
 *                   currentInterviewStepName:
 *                     type: string
 *                     example: Technical Interview
 *                   averageScore:
 *                     type: number
 *                     nullable: true
 *                     example: 4.5
 *             example:
 *               - candidateId: 1
 *                 applicationId: 12
 *                 fullName: John Doe
 *                 currentInterviewStep: 2
 *                 currentInterviewStepName: Technical Interview
 *                 averageScore: 4.5
 *               - candidateId: 3
 *                 applicationId: 14
 *                 fullName: Carlos García
 *                 currentInterviewStep: 1
 *                 currentInterviewStepName: Initial Screening
 *                 averageScore: null
 *       400:
 *         description: Invalid position ID format.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Position not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id/candidates', authenticate, getCandidatesByPosition);

export default router;
