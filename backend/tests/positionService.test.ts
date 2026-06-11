import { getPositionCandidates } from '../src/application/services/positionService';

// ---------------------------------------------------------------------------
// Mock PrismaClient — the Position domain model instantiates it at module load
// ---------------------------------------------------------------------------
const mockFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    position: { findUnique: mockFindUnique },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers — build minimal Prisma-shaped objects
// ---------------------------------------------------------------------------
function makePosition(overrides: {
  applications?: ReturnType<typeof makeApplication>[];
} = {}) {
  return {
    id: 1,
    title: 'Backend Engineer',
    applications: overrides.applications ?? [],
  };
}

function makeApplication(overrides: {
  candidate?: { firstName: string; lastName: string };
  interviewStep?: { name: string };
  interviews?: { score: number | null }[];
} = {}) {
  return {
    id: 1,
    candidateId: 1,
    positionId: 1,
    applicationDate: new Date(),
    currentInterviewStep: 1,
    notes: null,
    candidate: overrides.candidate ?? { firstName: 'Ana', lastName: 'García' },
    interviewStep: overrides.interviewStep ?? { name: 'Phone Screen' },
    interviews: overrides.interviews ?? [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPositionCandidates', () => {

  // 1. Happy path ─────────────────────────────────────────────────────────
  it('returns candidates with fullName, currentInterviewStep and averageScore', async () => {
    mockFindUnique.mockResolvedValue(
      makePosition({
        applications: [
          makeApplication({
            candidate: { firstName: 'Ana', lastName: 'García' },
            interviewStep: { name: 'Technical Interview' },
            interviews: [{ score: 8 }, { score: 6 }],
          }),
        ],
      })
    );

    const result = await getPositionCandidates(1);

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Ana García');
    expect(result[0].currentInterviewStep).toBe('Technical Interview');
    expect(result[0].averageScore).toBe(7);  // (8+6)/2
  });

  // 2. averageScore null — caso borde crítico del ticket ──────────────────
  it('returns averageScore as null (not 0) when no interviews have a score', async () => {
    mockFindUnique.mockResolvedValue(
      makePosition({
        applications: [
          makeApplication({
            interviews: [{ score: null }, { score: null }],
          }),
        ],
      })
    );

    const result = await getPositionCandidates(1);

    expect(result[0].averageScore).toBeNull();
    // Explicit: must NOT be 0 or NaN
    expect(result[0].averageScore).not.toBe(0);
    expect(result[0].averageScore).not.toBeNaN();
  });

  // 3. averageScore — media correcta con scores mixtos ───────────────────
  it('computes averageScore ignoring null scores', async () => {
    mockFindUnique.mockResolvedValue(
      makePosition({
        applications: [
          makeApplication({
            interviews: [{ score: 10 }, { score: null }, { score: 6 }],
          }),
        ],
      })
    );

    const result = await getPositionCandidates(1);

    // Only non-null scores: (10 + 6) / 2 = 8
    expect(result[0].averageScore).toBe(8);
  });

  // 4. Posición sin aplicaciones → array vacío ────────────────────────────
  it('returns an empty array when the position has no applications', async () => {
    mockFindUnique.mockResolvedValue(makePosition({ applications: [] }));

    const result = await getPositionCandidates(1);

    expect(result).toEqual([]);
  });

  // 5. 404 — posición no encontrada ───────────────────────────────────────
  it('throws { status: 404 } when the position does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getPositionCandidates(999)).rejects.toMatchObject({
      status: 404,
      message: 'Position not found',
    });
  });

  // 6. 400 — id inválido ──────────────────────────────────────────────────
  it('throws { status: 400 } when the id is not a positive integer', async () => {
    await expect(getPositionCandidates(NaN)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid position id',
    });

    await expect(getPositionCandidates(0)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid position id',
    });

    await expect(getPositionCandidates(-5)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid position id',
    });
  });

});
