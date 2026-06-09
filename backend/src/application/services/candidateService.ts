import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

/**
 * Error codes carried on thrown Errors so the controller can map failures to
 * HTTP statuses, matching the existing convention (see `error.code === 'P2002'`).
 */
export const CANDIDATE_NOT_FOUND = 'CANDIDATE_NOT_FOUND';
export const APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND';
export const STEP_FLOW_MISMATCH = 'STEP_FLOW_MISMATCH';

/** Builds an Error tagged with the given code. */
const codedError = (code: string, message: string): Error => {
    const error = new Error(message);
    (error as Error & { code?: string }).code = code;
    return error;
};

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

/**
 * Updates the current interview stage of a candidate's application.
 * Supports drag-and-drop in a kanban UI.
 *
 * @param prisma  Prisma client attached to the request (req.prisma).
 * @param candidateId  Candidate identifier.
 * @param applicationId  Application to update (a candidate may have several).
 * @param currentInterviewStep  Target InterviewStep id.
 * @throws Error code CANDIDATE_NOT_FOUND when the candidate does not exist.
 * @throws Error code APPLICATION_NOT_FOUND when the application does not exist
 *         or is not linked to the candidate.
 * @throws Error code STEP_FLOW_MISMATCH when the target step belongs to a
 *         different interview flow than the application's position.
 */
export const updateCandidateStage = async (
    prisma: PrismaClient,
    candidateId: number,
    applicationId: number,
    currentInterviewStep: number
) => {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
    });
    if (!candidate) {
        throw codedError(CANDIDATE_NOT_FOUND, 'Candidate not found');
    }

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: {
            id: true,
            candidateId: true,
            position: { select: { interviewFlowId: true } },
        },
    });
    if (!application || application.candidateId !== candidateId) {
        throw codedError(APPLICATION_NOT_FOUND, 'Application not found');
    }

    const interviewStep = await prisma.interviewStep.findUnique({
        where: { id: currentInterviewStep },
        select: { interviewFlowId: true },
    });
    if (
        !interviewStep ||
        interviewStep.interviewFlowId !== application.position.interviewFlowId
    ) {
        throw codedError(
            STEP_FLOW_MISMATCH,
            "Interview step does not belong to this position's flow"
        );
    }

    return prisma.application.update({
        where: { id: applicationId },
        data: { currentInterviewStep },
        select: {
            id: true,
            positionId: true,
            candidateId: true,
            currentInterviewStep: true,
            notes: true,
        },
    });
};
