import { validateCandidateData } from '../validator';
import prisma from '../../infrastructure/database/prismaClient';
import { Candidate } from '../../domain/models/Candidate';

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData);
    } catch (error: any) {
        throw error;
    }

    try {
        const created = await prisma.candidate.create({
            data: {
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
            },
        });

        if (candidateData.educations?.length) {
            await prisma.education.createMany({
                data: candidateData.educations.map((edu: any) => ({
                    candidateId: created.id,
                    institution: edu.institution,
                    title: edu.title,
                    startDate: new Date(edu.startDate),
                    endDate: edu.endDate ? new Date(edu.endDate) : null,
                })),
            });
        }

        if (candidateData.workExperiences?.length) {
            await prisma.workExperience.createMany({
                data: candidateData.workExperiences.map((exp: any) => ({
                    candidateId: created.id,
                    company: exp.company,
                    position: exp.position,
                    description: exp.description,
                    startDate: new Date(exp.startDate),
                    endDate: exp.endDate ? new Date(exp.endDate) : null,
                })),
            });
        }

        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            await prisma.resume.create({
                data: {
                    candidateId: created.id,
                    filePath: candidateData.cv.filePath,
                    fileType: candidateData.cv.fileType,
                    uploadDate: new Date(),
                },
            });
        }

        return created;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('The email already exists in the database');
        }
        throw error;
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const data = await prisma.candidate.findUnique({
            where: { id },
            include: {
                educations: true,
                workExperiences: true,
                resumes: true,
                applications: {
                    include: {
                        position: { select: { id: true, title: true } },
                        interviews: {
                            select: {
                                interviewDate: true,
                                interviewStep: { select: { name: true } },
                                notes: true,
                                score: true,
                            },
                        },
                    },
                },
            },
        });
        if (!data) return null;
        return new Candidate(data);
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};
