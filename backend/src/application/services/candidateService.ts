import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
 * Obtiene los candidatos en proceso para una determinada posición
 * @param positionId - ID de la posición
 * @returns Array con candidatos, su fase actual y puntuación media
 */
export const getCandidatesByPosition = async (positionId: number) => {
    try {
        // Obtener todas las aplicaciones para la posición
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: true,
                interviewStep: true,
                interviews: {
                    include: {
                        interviewStep: true
                    }
                }
            }
        });

        if (applications.length === 0) {
            return [];
        }

        // Mapear datos para retornar la información solicitada
        const candidatesData = applications.map((application) => {
            const { candidate, interviews, interviewStep } = application;

            // Calcular la puntuación media de las entrevistas realizadas
            const completedInterviews = interviews.filter(interview => interview.score !== null);
            const averageScore = completedInterviews.length > 0
                ? completedInterviews.reduce((sum, interview) => sum + (interview.score || 0), 0) / completedInterviews.length
                : 0;

            return {
                candidateId: candidate.id,
                fullName: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email,
                currentStage: interviewStep.name,
                currentStageId: interviewStep.id,
                averageScore: parseFloat(averageScore.toFixed(2)),
                totalInterviews: completedInterviews.length,
                applicationDate: application.applicationDate
            };
        });

        return candidatesData;
    } catch (error) {
        console.error('Error al obtener candidatos para la posición:', error);
        throw new Error('Error al recuperar candidatos de la posición');
    }
};

/**
 * Actualiza la fase actual del proceso de entrevista para un candidato
 * @param candidateId - ID del candidato
 * @param newStageId - ID de la nueva fase (InterviewStep)
 * @returns La aplicación actualizada
 */
export const updateCandidateStage = async (candidateId: number, newStageId: number) => {
    try {
        // Validar que la nueva etapa existe
        const interviewStep = await prisma.interviewStep.findUnique({
            where: { id: newStageId }
        });

        if (!interviewStep) {
            throw new Error('La fase de entrevista especificada no existe');
        }

        // Obtener la aplicación activa del candidato
        // Nota: Asumimos que un candidato puede tener una aplicación activa por posición
        // Si tienes una lógica diferente, ajusta esta consulta
        const application = await prisma.application.findFirst({
            where: { candidateId }
        });

        if (!application) {
            throw new Error('No se encontró una aplicación para este candidato');
        }

        // Actualizar la fase actual del candidato
        const updatedApplication = await prisma.application.update({
            where: { id: application.id },
            data: {
                currentInterviewStep: newStageId
            },
            include: {
                candidate: true,
                interviewStep: true,
                position: true
            }
        });

        return {
            applicationId: updatedApplication.id,
            candidateId: updatedApplication.candidateId,
            candidateName: `${updatedApplication.candidate.firstName} ${updatedApplication.candidate.lastName}`,
            positionTitle: updatedApplication.position.title,
            newStage: updatedApplication.interviewStep.name,
            newStageId: updatedApplication.interviewStep.id
        };
    } catch (error: any) {
        console.error('Error al actualizar la fase del candidato:', error);
        throw new Error(error.message || 'Error al actualizar la fase del candidato');
    }
};
