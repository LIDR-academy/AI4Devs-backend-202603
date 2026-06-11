import { Position } from '../../domain/models/Position';
import { getCandidatesInProcess } from './positionService';

jest.mock('../../domain/models/Position');

const mockFindCandidatesInProcess = Position.findCandidatesInProcess as jest.Mock;

describe('getCandidatesInProcess', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve candidatos de una posición con sus datos', async () => {
        mockFindCandidatesInProcess.mockResolvedValue({
            id: 1,
            applications: [
                {
                    candidate: { id: 10, firstName: 'John', lastName: 'Doe' },
                    interviewStep: { id: 2, name: 'Technical Interview', orderIndex: 2 },
                    interviews: [{ score: 5 }],
                },
            ],
        });

        const result = await getCandidatesInProcess(1);

        expect(result).toEqual({
            positionId: 1,
            candidates: [
                {
                    candidateId: 10,
                    fullName: 'John Doe',
                    currentInterviewStep: {
                        id: 2,
                        name: 'Technical Interview',
                        orderIndex: 2,
                    },
                    averageScore: 5,
                },
            ],
        });
        expect(mockFindCandidatesInProcess).toHaveBeenCalledWith(1);
    });

    it('calcula correctamente averageScore como media redondeada a 1 decimal', async () => {
        mockFindCandidatesInProcess.mockResolvedValue({
            id: 1,
            applications: [
                {
                    candidate: { id: 10, firstName: 'Jane', lastName: 'Smith' },
                    interviewStep: { id: 2, name: 'Technical Interview', orderIndex: 2 },
                    interviews: [{ score: 5 }, { score: 4 }],
                },
            ],
        });

        const result = await getCandidatesInProcess(1);

        expect(result?.candidates[0].averageScore).toBe(4.5);
    });

    it('devuelve lista vacía cuando la posición no tiene candidaturas', async () => {
        mockFindCandidatesInProcess.mockResolvedValue({
            id: 2,
            applications: [],
        });

        const result = await getCandidatesInProcess(2);

        expect(result).toEqual({
            positionId: 2,
            candidates: [],
        });
    });

    it('devuelve null cuando la posición no existe', async () => {
        mockFindCandidatesInProcess.mockResolvedValue(null);

        const result = await getCandidatesInProcess(9999);

        expect(result).toBeNull();
    });
});
