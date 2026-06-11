import { validateCandidateData } from '../application/validator';

const minValid = { firstName: 'Ana', lastName: 'García', email: 'ana@test.com' };

// ---------------------------------------------------------------------------
// data.id ya NO omite validaciones (bypass eliminado en Prompt 13)
// ---------------------------------------------------------------------------

describe('data.id no omite validaciones', () => {
    it('con id presente y nombre inválido lanza error', () => {
        expect(() =>
            validateCandidateData({ id: 1, firstName: '1nv4lid', lastName: 'García', email: 'ana@test.com' })
        ).toThrow();
    });

    it('con id presente y email inválido lanza error', () => {
        expect(() =>
            validateCandidateData({ id: 1, firstName: 'Ana', lastName: 'García', email: 'no-es-email' })
        ).toThrow();
    });
});

// ---------------------------------------------------------------------------
// Validación de nombre — vía PersonName VO
// ---------------------------------------------------------------------------

describe('validación de nombre vía PersonName VO', () => {
    it('acepta nombres válidos con caracteres españoles', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: 'María José', lastName: 'García Ruiz' })
        ).not.toThrow();
    });

    it('lanza "Invalid name" si firstName contiene números', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: '1nv4lid' })
        ).toThrow('Invalid name');
    });

    it('lanza "Invalid name" si lastName contiene números', () => {
        expect(() =>
            validateCandidateData({ ...minValid, lastName: '1nv4lid' })
        ).toThrow('Invalid name');
    });

    it('lanza "Invalid name" si firstName tiene menos de 2 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: 'A' })
        ).toThrow('Invalid name');
    });

    it('lanza "Invalid name" si firstName tiene más de 50 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: 'A'.repeat(51) })
        ).toThrow('Invalid name');
    });

    it('acepta exactamente 2 caracteres en firstName', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: 'Jo' })
        ).not.toThrow();
    });

    it('acepta exactamente 50 caracteres en firstName', () => {
        expect(() =>
            validateCandidateData({ ...minValid, firstName: 'A'.repeat(50) })
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Validación de email — vía Email VO
// ---------------------------------------------------------------------------

describe('validación de email vía Email VO', () => {
    it('acepta un email válido', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('lanza "Invalid email" con email sin @', () => {
        expect(() =>
            validateCandidateData({ ...minValid, email: 'anatest.com' })
        ).toThrow('Invalid email');
    });

    it('lanza "Invalid email" con email sin dominio', () => {
        expect(() =>
            validateCandidateData({ ...minValid, email: 'ana@' })
        ).toThrow('Invalid email');
    });

    it('lanza "Invalid email" con string vacío', () => {
        expect(() =>
            validateCandidateData({ ...minValid, email: '' })
        ).toThrow('Invalid email');
    });
});

// ---------------------------------------------------------------------------
// Validación de teléfono — vía PhoneNumber VO (regex español)
// ---------------------------------------------------------------------------

describe('validación de teléfono vía PhoneNumber VO', () => {
    it('teléfono ausente no lanza error', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('acepta número español válido que empieza por 6', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '612345678' })
        ).not.toThrow();
    });

    it('acepta número español válido que empieza por 7', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '712345678' })
        ).not.toThrow();
    });

    it('acepta número español válido que empieza por 9', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '912345678' })
        ).not.toThrow();
    });

    it('lanza "Invalid phone" con número que empieza por 5', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '512345678' })
        ).toThrow('Invalid phone');
    });

    it('lanza "Invalid phone" con número de menos de 9 dígitos', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '61234567' })
        ).toThrow('Invalid phone');
    });

    it('lanza "Invalid phone" con número de más de 9 dígitos', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '6123456789' })
        ).toThrow('Invalid phone');
    });

    it('lanza "Invalid phone" con formato internacional +34', () => {
        expect(() =>
            validateCandidateData({ ...minValid, phone: '+34612345678' })
        ).toThrow('Invalid phone');
    });
});

// ---------------------------------------------------------------------------
// Validación de dirección
// ---------------------------------------------------------------------------

describe('validación de dirección', () => {
    it('dirección ausente no lanza error', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('acepta dirección de exactamente 100 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...minValid, address: 'A'.repeat(100) })
        ).not.toThrow();
    });

    it('lanza error con dirección de más de 100 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...minValid, address: 'A'.repeat(101) })
        ).toThrow('Invalid address');
    });
});

// ---------------------------------------------------------------------------
// Validación de educaciones
// ---------------------------------------------------------------------------

describe('validación de educaciones', () => {
    const validEdu = { institution: 'UCM', title: 'Informática', startDate: '2018-09-01' };

    it('educaciones ausentes no lanza error', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('acepta educación válida con startDate', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [validEdu] })
        ).not.toThrow();
    });

    it('acepta educación válida con startDate y endDate', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [{ ...validEdu, endDate: '2022-06-30' }] })
        ).not.toThrow();
    });

    it('lanza error si institution está vacío', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [{ ...validEdu, institution: '' }] })
        ).toThrow('Invalid institution');
    });

    it('lanza error si title está vacío', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [{ ...validEdu, title: '' }] })
        ).toThrow('Invalid title');
    });

    it('lanza error si startDate tiene formato incorrecto', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [{ ...validEdu, startDate: '01/09/2018' }] })
        ).toThrow('Invalid date');
    });

    it('lanza error si endDate tiene formato incorrecto', () => {
        expect(() =>
            validateCandidateData({ ...minValid, educations: [{ ...validEdu, endDate: '30-06-2022' }] })
        ).toThrow('Invalid end date');
    });
});

// ---------------------------------------------------------------------------
// Validación de experiencias laborales
// ---------------------------------------------------------------------------

describe('validación de experiencias laborales', () => {
    const validExp = { company: 'Acme', position: 'Dev', startDate: '2020-01-01' };

    it('workExperiences ausentes no lanza error', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('acepta experiencia válida', () => {
        expect(() =>
            validateCandidateData({ ...minValid, workExperiences: [validExp] })
        ).not.toThrow();
    });

    it('lanza error si company está vacío', () => {
        expect(() =>
            validateCandidateData({ ...minValid, workExperiences: [{ ...validExp, company: '' }] })
        ).toThrow('Invalid company');
    });

    it('lanza error si position está vacío', () => {
        expect(() =>
            validateCandidateData({ ...minValid, workExperiences: [{ ...validExp, position: '' }] })
        ).toThrow('Invalid position');
    });

    it('lanza error si description supera 200 caracteres', () => {
        expect(() =>
            validateCandidateData({
                ...minValid,
                workExperiences: [{ ...validExp, description: 'X'.repeat(201) }],
            })
        ).toThrow('Invalid description');
    });

    it('lanza error si startDate tiene formato incorrecto', () => {
        expect(() =>
            validateCandidateData({ ...minValid, workExperiences: [{ ...validExp, startDate: '2020/01/01' }] })
        ).toThrow('Invalid date');
    });
});

// ---------------------------------------------------------------------------
// Validación del CV
// ---------------------------------------------------------------------------

describe('validación del CV', () => {
    it('cv ausente no lanza error', () => {
        expect(() => validateCandidateData(minValid)).not.toThrow();
    });

    it('cv como objeto vacío {} no lanza error — equivale a "sin CV" por diseño', () => {
        // Object.keys({}).length === 0 → validateCV nunca se llama
        expect(() =>
            validateCandidateData({ ...minValid, cv: {} })
        ).not.toThrow();
    });

    it('acepta cv con filePath y fileType válidos', () => {
        expect(() =>
            validateCandidateData({ ...minValid, cv: { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' } })
        ).not.toThrow();
    });

    it('lanza "Invalid CV data" si cv.filePath está ausente', () => {
        expect(() =>
            validateCandidateData({ ...minValid, cv: { fileType: 'application/pdf' } })
        ).toThrow('Invalid CV data');
    });

    it('lanza "Invalid CV data" si cv.fileType está ausente', () => {
        expect(() =>
            validateCandidateData({ ...minValid, cv: { filePath: '/uploads/cv.pdf' } })
        ).toThrow('Invalid CV data');
    });
});
