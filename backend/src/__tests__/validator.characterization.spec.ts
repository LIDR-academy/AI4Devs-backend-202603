/**
 * Characterization tests — validator.ts
 *
 * Documentan el comportamiento actual del validador tras aplicar el plan de corrección
 * completo (Prompts 11–13) y las decisiones de diseño del Prompt 14.
 *
 * Decisiones aplicadas:
 * - Bypass data.id eliminado: se validaba incondicionalmente.
 * - cv: {} es comportamiento por diseño (equivale a "sin CV"), igual que el servicio.
 */

import { validateCandidateData } from '../application/validator';

const validBase = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@test.com',
};

// ---------------------------------------------------------------------------
// SIN BYPASS — data.id ya no omite validaciones (Prompt 14)
// ---------------------------------------------------------------------------

describe('data.id no omite validaciones', () => {
    it('valida aunque data.id sea un número positivo', () => {
        expect(() =>
            validateCandidateData({ id: 1, email: 'esto-no-es-email' })
        ).toThrow();
    });

    it('valida aunque data.id sea un string', () => {
        expect(() =>
            validateCandidateData({ id: 'abc', firstName: '123', email: 'malformed' })
        ).toThrow();
    });

    it('valida aunque data.id sea 0', () => {
        expect(() =>
            validateCandidateData({ id: 0, firstName: '123', email: 'malformed' })
        ).toThrow();
    });
});

// ---------------------------------------------------------------------------
// NOMBRE (PersonName Value Object)
// ---------------------------------------------------------------------------

describe('validación de nombre vía PersonName VO', () => {
    it('acepta nombres con letras básicas y acentos', () => {
        expect(() => validateCandidateData({ ...validBase })).not.toThrow();
    });

    it('acepta nombres con ñ y caracteres especiales del español', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: 'Íñigo', lastName: 'Muñoz' })
        ).not.toThrow();
    });

    it('rechaza firstName con números', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: '4na' })
        ).toThrow('Invalid name');
    });

    it('rechaza firstName con caracteres especiales no permitidos', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: 'Ana!' })
        ).toThrow('Invalid name');
    });

    it('rechaza firstName de 1 carácter (mínimo 2)', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: 'A' })
        ).toThrow('Invalid name');
    });

    it('rechaza firstName de más de 50 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: 'A'.repeat(51) })
        ).toThrow('Invalid name');
    });

    it('rechaza lastName vacío', () => {
        expect(() =>
            validateCandidateData({ ...validBase, lastName: '' })
        ).toThrow('Invalid name');
    });

    it('el mensaje de error es exactamente "Invalid name"', () => {
        expect(() =>
            validateCandidateData({ ...validBase, firstName: '123' })
        ).toThrow('Invalid name');
    });
});

// ---------------------------------------------------------------------------
// EMAIL (Email Value Object)
// ---------------------------------------------------------------------------

describe('validación de email vía Email VO', () => {
    it('acepta email con formato estándar', () => {
        expect(() =>
            validateCandidateData({ ...validBase, email: 'usuario@dominio.com' })
        ).not.toThrow();
    });

    it('rechaza email sin @', () => {
        expect(() =>
            validateCandidateData({ ...validBase, email: 'usuariodominio.com' })
        ).toThrow('Invalid email');
    });

    it('rechaza email sin dominio después del punto', () => {
        expect(() =>
            validateCandidateData({ ...validBase, email: 'usuario@dominio.' })
        ).toThrow('Invalid email');
    });

    it('rechaza string vacío como email', () => {
        expect(() =>
            validateCandidateData({ ...validBase, email: '' })
        ).toThrow('Invalid email');
    });
});

// ---------------------------------------------------------------------------
// TELÉFONO (regex directo — [LEGACY] no usa PhoneNumber VO)
// ---------------------------------------------------------------------------

describe('[LEGACY] validación de teléfono — regex español directo, sin usar PhoneNumber VO', () => {
    it('es opcional: undefined no lanza error', () => {
        expect(() =>
            validateCandidateData({ ...validBase, phone: undefined })
        ).not.toThrow();
    });

    it('es opcional: string vacío no lanza error (falsy, se omite)', () => {
        // [LEGACY] String vacío se trata como "no proporcionado"
        expect(() =>
            validateCandidateData({ ...validBase, phone: '' })
        ).not.toThrow();
    });

    it('acepta número español de 9 dígitos comenzando en 6', () => {
        expect(() =>
            validateCandidateData({ ...validBase, phone: '612345678' })
        ).not.toThrow();
    });

    it('acepta número español de 9 dígitos comenzando en 7', () => {
        expect(() =>
            validateCandidateData({ ...validBase, phone: '712345678' })
        ).not.toThrow();
    });

    it('acepta número español de 9 dígitos comenzando en 9', () => {
        expect(() =>
            validateCandidateData({ ...validBase, phone: '912345678' })
        ).not.toThrow();
    });

    it('rechaza número comenzando en 5', () => {
        expect(() =>
            validateCandidateData({ ...validBase, phone: '512345678' })
        ).toThrow('Invalid phone');
    });

    it('[LEGACY] rechaza formato internacional aunque el PhoneNumber VO lo aceptaría', () => {
        // El validator usa /^(6|7|9)\d{8}$/ directamente.
        // PhoneNumber VO usa regex internacional — pero NO está conectado al validator.
        // Este test documenta la brecha: ambos artefactos tienen comportamiento distinto.
        expect(() =>
            validateCandidateData({ ...validBase, phone: '+34612345678' })
        ).toThrow('Invalid phone');
    });

    it('[LEGACY] el mensaje de error es "Invalid phone", no "Invalid phone number" (difiere del VO)', () => {
        // PhoneNumber.ts lanza "Invalid phone number" — el validator lanza "Invalid phone"
        expect(() =>
            validateCandidateData({ ...validBase, phone: '512345678' })
        ).toThrow('Invalid phone');
    });
});

// ---------------------------------------------------------------------------
// DIRECCIÓN
// ---------------------------------------------------------------------------

describe('validación de dirección', () => {
    it('es opcional: undefined no lanza error', () => {
        expect(() =>
            validateCandidateData({ ...validBase })
        ).not.toThrow();
    });

    it('acepta dirección dentro del límite de 100 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...validBase, address: 'Calle Mayor 1, Madrid' })
        ).not.toThrow();
    });

    it('rechaza dirección de más de 100 caracteres', () => {
        expect(() =>
            validateCandidateData({ ...validBase, address: 'C'.repeat(101) })
        ).toThrow('Invalid address');
    });

    it('[LEGACY] acepta string vacío como dirección (tratado como no proporcionado)', () => {
        // El check es `if (address && address.length > 100)` — string vacío es falsy
        expect(() =>
            validateCandidateData({ ...validBase, address: '' })
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// EDUCACIÓN
// ---------------------------------------------------------------------------

describe('validación de educaciones', () => {
    const validEducation = {
        institution: 'Universidad Complutense',
        title: 'Informática',
        startDate: '2015-09-01',
    };

    it('educations ausente: no lanza error (campo opcional)', () => {
        expect(() => validateCandidateData({ ...validBase })).not.toThrow();
    });

    it('acepta una educación con datos mínimos válidos', () => {
        expect(() =>
            validateCandidateData({ ...validBase, educations: [validEducation] })
        ).not.toThrow();
    });

    it('rechaza institution vacía', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, institution: '' }],
            })
        ).toThrow('Invalid institution');
    });

    it('rechaza institution de más de 100 caracteres', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, institution: 'U'.repeat(101) }],
            })
        ).toThrow('Invalid institution');
    });

    it('rechaza title vacío', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, title: '' }],
            })
        ).toThrow('Invalid title');
    });

    it('rechaza startDate ausente', () => {
        const { startDate: _, ...withoutDate } = validEducation;
        expect(() =>
            validateCandidateData({ ...validBase, educations: [withoutDate] })
        ).toThrow('Invalid date');
    });

    it('rechaza startDate con formato incorrecto', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, startDate: '01/09/2015' }],
            })
        ).toThrow('Invalid date');
    });

    it('endDate es opcional: ausente no lanza error', () => {
        expect(() =>
            validateCandidateData({ ...validBase, educations: [validEducation] })
        ).not.toThrow();
    });

    it('rechaza endDate con formato incorrecto cuando está presente', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, endDate: '30-06-2019' }],
            })
        ).toThrow('Invalid end date');
    });

    it('acepta endDate con formato YYYY-MM-DD cuando está presente', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                educations: [{ ...validEducation, endDate: '2019-06-30' }],
            })
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// EXPERIENCIA LABORAL
// ---------------------------------------------------------------------------

describe('validación de experiencia laboral', () => {
    const validExperience = {
        company: 'Acme Corp',
        position: 'Backend Developer',
        startDate: '2019-09-01',
    };

    it('workExperiences ausente: no lanza error (campo opcional)', () => {
        expect(() => validateCandidateData({ ...validBase })).not.toThrow();
    });

    it('acepta una experiencia con datos mínimos válidos', () => {
        expect(() =>
            validateCandidateData({ ...validBase, workExperiences: [validExperience] })
        ).not.toThrow();
    });

    it('rechaza company vacía', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                workExperiences: [{ ...validExperience, company: '' }],
            })
        ).toThrow('Invalid company');
    });

    it('rechaza position vacía', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                workExperiences: [{ ...validExperience, position: '' }],
            })
        ).toThrow('Invalid position');
    });

    it('rechaza description de más de 200 caracteres', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                workExperiences: [{ ...validExperience, description: 'D'.repeat(201) }],
            })
        ).toThrow('Invalid description');
    });

    it('description ausente: no lanza error', () => {
        expect(() =>
            validateCandidateData({ ...validBase, workExperiences: [validExperience] })
        ).not.toThrow();
    });

    it('rechaza startDate ausente', () => {
        const { startDate: _, ...withoutDate } = validExperience;
        expect(() =>
            validateCandidateData({ ...validBase, workExperiences: [withoutDate] })
        ).toThrow('Invalid date');
    });

    it('rechaza endDate con formato incorrecto cuando está presente', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                workExperiences: [{ ...validExperience, endDate: '2023/12/31' }],
            })
        ).toThrow('Invalid end date');
    });
});

// ---------------------------------------------------------------------------
// CV
// ---------------------------------------------------------------------------

describe('validación del CV', () => {
    it('cv ausente: no lanza error', () => {
        expect(() => validateCandidateData({ ...validBase })).not.toThrow();
    });

    it('cv como objeto vacío {} no lanza error — equivale a "sin CV" por diseño', () => {
        // Decisión de diseño (Prompt 14): cv: {} es tratado como "sin CV proporcionado",
        // coherente con candidateService.ts que también omite la creación del resume
        // cuando Object.keys(cv).length === 0.
        expect(() =>
            validateCandidateData({ ...validBase, cv: {} })
        ).not.toThrow();
    });

    it('acepta cv con filePath y fileType válidos', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                cv: { filePath: 'uploads/cv.pdf', fileType: 'application/pdf' },
            })
        ).not.toThrow();
    });

    it('rechaza cv con filePath pero sin fileType', () => {
        // [LEGACY] El api-spec no marca fileType como required, pero el validator sí lo exige
        expect(() =>
            validateCandidateData({
                ...validBase,
                cv: { filePath: 'uploads/cv.pdf' },
            })
        ).toThrow('Invalid CV data');
    });

    it('rechaza cv con fileType pero sin filePath', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                cv: { fileType: 'application/pdf' },
            })
        ).toThrow('Invalid CV data');
    });

    it('rechaza cv con filePath vacío', () => {
        expect(() =>
            validateCandidateData({
                ...validBase,
                cv: { filePath: '', fileType: 'application/pdf' },
            })
        ).toThrow('Invalid CV data');
    });
});
