import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

// --- Kanban stage management ---------------------------------------------

/** Thrown when the candidate does not exist. Mapped to HTTP 404. */
export class CandidateNotFoundError extends Error {
    constructor(candidateId: number) {
        super(`Candidate with id ${candidateId} not found`);
        this.name = 'CandidateNotFoundError';
        Object.setPrototypeOf(this, CandidateNotFoundError.prototype);
    }
}

/**
 * Thrown when no application matches the candidate (and optional position).
 * Mapped to HTTP 404.
 */
export class ApplicationNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApplicationNotFoundError';
        Object.setPrototypeOf(this, ApplicationNotFoundError.prototype);
    }
}

/**
 * Thrown when a candidate has several applications and the caller did not
 * disambiguate with a positionId. Mapped to HTTP 400.
 */
export class AmbiguousApplicationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AmbiguousApplicationError';
        Object.setPrototypeOf(this, AmbiguousApplicationError.prototype);
    }
}

/**
 * Thrown when the requested stage is not a valid step of the application's
 * interview flow. Mapped to HTTP 400. Carries the list of accepted stage names.
 */
export class InvalidStageError extends Error {
    validStages: string[];
    constructor(newStage: string, validStages: string[]) {
        super(`Invalid stage "${newStage}". Valid stages: ${validStages.join(', ')}`);
        this.name = 'InvalidStageError';
        this.validStages = validStages;
        Object.setPrototypeOf(this, InvalidStageError.prototype);
    }
}

export interface UpdatedCandidateStage {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    applicationId: number;
    positionId: number;
    /** Raw value of the `current_interview_step` FK after the update. */
    currentInterviewStep: number;
    /** Human-readable name of the new interview step. */
    currentInterviewStepName: string;
}

/**
 * Move a candidate to a new stage on the Kanban board.
 *
 * A "stage" is the *name* of an interview step belonging to the position's
 * interview flow (see Application.currentInterviewStep, an FK to
 * InterviewStep.id). The new stage is validated against the actual steps of the
 * relevant application's flow — the database is the source of truth — and the
 * application's `currentInterviewStep` FK is updated accordingly.
 *
 * @param prisma     Prisma client (injected for testability).
 * @param candidateId The candidate being moved.
 * @param newStage    The target stage name (matched case-insensitively).
 * @param positionId  Optional, required only when the candidate has multiple
 *                    applications, to pick which application to update.
 *
 * @throws {CandidateNotFoundError}     candidate does not exist (404)
 * @throws {ApplicationNotFoundError}   no matching application (404)
 * @throws {AmbiguousApplicationError}  multiple applications, positionId missing (400)
 * @throws {InvalidStageError}          newStage not valid for the flow (400)
 */
export const updateCandidateStage = async (
    prisma: PrismaClient,
    candidateId: number,
    newStage: string,
    positionId?: number,
): Promise<UpdatedCandidateStage> => {
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
        throw new CandidateNotFoundError(candidateId);
    }

    const applications = await prisma.application.findMany({
        where: {
            candidateId,
            ...(positionId !== undefined ? { positionId } : {}),
        },
        include: {
            position: {
                include: {
                    interviewFlow: {
                        include: { interviewSteps: true },
                    },
                },
            },
        },
    });

    if (applications.length === 0) {
        throw new ApplicationNotFoundError(
            positionId !== undefined
                ? `No application found for candidate ${candidateId} and position ${positionId}`
                : `No application found for candidate ${candidateId}`,
        );
    }

    if (applications.length > 1) {
        throw new AmbiguousApplicationError(
            `Candidate ${candidateId} has multiple applications; specify positionId in the body to choose one.`,
        );
    }

    const application = applications[0];
    const steps = application.position.interviewFlow.interviewSteps;

    const targetStep = steps.find(
        (step) => step.name.toLowerCase() === newStage.trim().toLowerCase(),
    );

    if (!targetStep) {
        throw new InvalidStageError(
            newStage,
            steps.map((step) => step.name),
        );
    }

    const updated = await prisma.application.update({
        where: { id: application.id },
        data: { currentInterviewStep: targetStep.id },
    });

    // Return the updated candidate object including its new stage, as specified.
    return {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        address: candidate.address,
        applicationId: updated.id,
        positionId: updated.positionId,
        currentInterviewStep: targetStep.id,
        currentInterviewStepName: targetStep.name,
    };
};
