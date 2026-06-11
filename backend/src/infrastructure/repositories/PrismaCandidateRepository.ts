import prisma from '../database/prismaClient';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { Candidate } from '../../domain/models/Candidate';

export class PrismaCandidateRepository implements ICandidateRepository {
    async findById(id: number): Promise<Candidate | null> {
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
    }

    async save(candidate: Candidate): Promise<Candidate> {
        const data = await prisma.candidate.create({
            data: {
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                email: candidate.email,
                phone: candidate.phone,
                address: candidate.address,
            },
        });
        return new Candidate(data);
    }
}
