import { Position } from '../domain/models/Position';
import { getCandidatesByPosition } from '../application/services/positionService';

jest.mock('../domain/models/Position');

const mockedPosition = Position as jest.Mocked<typeof Position>;

describe('positionService.getCandidatesByPosition', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('throws "Position not found" when the position does not exist', async () => {
        mockedPosition.findOne.mockResolvedValue(null);

        await expect(getCandidatesByPosition(999)).rejects.toThrow('Position not found');
    });

    it('returns an empty array when the position has no applications', async () => {
        mockedPosition.findOne.mockResolvedValue({ id: 1 } as any);
        mockedPosition.findApplicationsWithCandidates.mockResolvedValue([] as any);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([]);
    });

    it('maps applications to the DTO and averages interview scores', async () => {
        mockedPosition.findOne.mockResolvedValue({ id: 1 } as any);
        mockedPosition.findApplicationsWithCandidates.mockResolvedValue([
            {
                id: 10,
                currentInterviewStep: 2,
                candidate: { id: 5, firstName: 'Jane', lastName: 'Doe' },
                interviewStep: { id: 2, name: 'Technical Interview' },
                interviews: [{ score: 4 }, { score: 5 }],
            },
        ] as any);

        const result = await getCandidatesByPosition(1);

        expect(result).toEqual([
            {
                candidateId: 5,
                applicationId: 10,
                fullName: 'Jane Doe',
                currentInterviewStep: 2,
                stepName: 'Technical Interview',
                averageScore: 4.5,
            },
        ]);
    });

    it('ignores null scores and returns null when there are no scores', async () => {
        mockedPosition.findOne.mockResolvedValue({ id: 1 } as any);
        mockedPosition.findApplicationsWithCandidates.mockResolvedValue([
            {
                id: 11,
                currentInterviewStep: 1,
                candidate: { id: 6, firstName: 'John', lastName: 'Smith' },
                interviewStep: { id: 1, name: 'HR' },
                interviews: [{ score: null }, { score: 6 }],
            },
            {
                id: 12,
                currentInterviewStep: 1,
                candidate: { id: 7, firstName: 'Amy', lastName: 'Lee' },
                interviewStep: { id: 1, name: 'HR' },
                interviews: [{ score: null }],
            },
        ] as any);

        const result = await getCandidatesByPosition(1);

        expect(result[0].averageScore).toBe(6);
        expect(result[1].averageScore).toBeNull();
    });
});
