import { Router } from 'express';
import {
    addCandidate,
    getCandidateById,
    updateCandidateStageController,
} from '../presentation/controllers/candidateController';
import { authenticate, authorize } from '../presentation/middleware/authMiddleware';
import { STAGE_MODIFIER_ROLES } from '../application/constants/interviewStages';

const router = Router();

router.post('/', async (req, res) => {
  try {
    // console.log(req.body); //Just in case you want to inspect the request body
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

router.get('/:id', getCandidateById);

/**
 * @swagger
 * /candidates/{id}/stage:
 *   put:
 *     summary: Update a candidate's Kanban stage
 *     description: >
 *       Moves a candidate to a new stage. A stage is the name of an interview
 *       step that belongs to the position's interview flow. If the candidate
 *       has more than one application, `positionId` must be supplied to choose
 *       which application to update. Restricted to recruiter/admin roles.
 *     tags:
 *       - Candidates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the candidate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newStage
 *             properties:
 *               newStage:
 *                 type: string
 *                 description: Target stage name (matched case-insensitively).
 *                 example: Technical Interview
 *               positionId:
 *                 type: integer
 *                 description: Required only when the candidate has multiple applications.
 *                 example: 1
 *           example:
 *             newStage: Technical Interview
 *             positionId: 1
 *     responses:
 *       200:
 *         description: Candidate stage updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: Candidate stage updated successfully
 *               data:
 *                 id: 1
 *                 firstName: John
 *                 lastName: Doe
 *                 email: john.doe@gmail.com
 *                 phone: '1234567890'
 *                 address: 123 Main St
 *                 applicationId: 12
 *                 positionId: 1
 *                 currentInterviewStep: 2
 *                 currentInterviewStepName: Technical Interview
 *       400:
 *         description: Invalid input, invalid stage, or ambiguous application.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Insufficient permissions.
 *       404:
 *         description: Candidate or application not found.
 *       500:
 *         description: Internal server error.
 */
router.put(
  '/:id/stage',
  authenticate,
  authorize(...STAGE_MODIFIER_ROLES),
  updateCandidateStageController,
);

export default router;
