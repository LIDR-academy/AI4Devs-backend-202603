import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { Application } from '../../domain/models/Application';
import { validateCandidateData, validateStageUpdateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

const prisma = new PrismaClient();

// Error de "recurso no encontrado" para que el controller pueda responder 404.
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
        // Necesario para que instanceof funcione al transpilar a ES5.
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

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

// Actualiza la fase actual (currentInterviewStep) de la aplicación de un candidato.
// - 400 (Error) si el body es inválido o el step no existe.
// - 404 (NotFoundError) si la aplicación no existe o no pertenece al candidato.
export const updateCandidateStage = async (
    candidateId: number,
    body: { applicationId: number; currentInterviewStep: number }
) => {
    validateStageUpdateData(body);

    const application = await Application.findOne(body.applicationId);
    if (!application || application.candidateId !== candidateId) {
        throw new NotFoundError('Application not found for the given candidate');
    }

    const step = await prisma.interviewStep.findUnique({
        where: { id: body.currentInterviewStep },
    });
    if (!step) {
        throw new Error('Invalid currentInterviewStep: step does not exist');
    }

    return await application.updateStage(body.currentInterviewStep);
};
