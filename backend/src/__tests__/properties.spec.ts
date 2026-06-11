/**
 * Property-Based Tests — Prompt 17
 *
 * Herramienta: fast-check 4.x + Jest (ts-jest)
 * Cobertura:
 *   - calculateAverageScore (función pura, sin dependencias externas)
 *   - Value Objects: Email, PersonName, PhoneNumber
 *   - getNextInterviewStep (helper de dominio puro, sin BD)
 */

import fc from 'fast-check';
import { calculateAverageScore } from '../application/services/positionService';
import { Email } from '../domain/valueObjects/Email';
import { PersonName } from '../domain/valueObjects/PersonName';
import { PhoneNumber } from '../domain/valueObjects/PhoneNumber';
import { getNextInterviewStep, StepRef } from '../domain/helpers/interviewFlow';

// ---------------------------------------------------------------------------
// Arbitrarios reutilizables
// ---------------------------------------------------------------------------

/** Genera emails con formato local@dominio.tld compatibles con nuestro EMAIL_REGEX */
const validEmailArb = fc.stringMatching(/^[a-zA-Z0-9]{1,10}@[a-zA-Z0-9]{1,10}\.[a-zA-Z]{2,5}$/);

/** Genera nombres de 2-50 letras ASCII (subconjunto válido de PersonName) */
const validNameArb = fc.stringMatching(/^[a-zA-Z]{2,50}$/);

/** Genera teléfonos españoles de 9 dígitos (empieza en 6, 7 o 9) */
const validPhoneArb = fc.stringMatching(/^[679]\d{8}$/);

/** Genera un array de steps con ids únicos y orderIndex únicos crecientes */
const stepsArb = fc.array(
    fc.nat({ max: 999 }),
    { minLength: 1, maxLength: 10 }
).map((offsets) => {
    let orderIndex = 0;
    return offsets.map((offset, i) => {
        orderIndex += 1 + (offset % 10);
        return { id: i + 1, orderIndex };
    }) as StepRef[];
});

// ---------------------------------------------------------------------------
// calculateAverageScore
// ---------------------------------------------------------------------------

describe('calculateAverageScore — propiedades', () => {
    // P1: El resultado siempre está acotado entre el mínimo y el máximo de los valores no-null
    it('[P1] resultado acotado entre min y max de los scores válidos', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1 }),
            (scores) => {
                const result = calculateAverageScore(scores);
                const min = Math.min(...scores);
                const max = Math.max(...scores);
                return result !== null && result >= min && result <= max;
            }
        ));
    });

    // P2: Añadir nulls al array no cambia el resultado
    it('[P2] añadir nulls al array no altera el promedio', () => {
        fc.assert(fc.property(
            fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1 }),
            fc.nat({ max: 5 }),
            (scores, nullCount) => {
                const withNulls: (number | null)[] = [...scores, ...Array<null>(nullCount).fill(null)];
                return calculateAverageScore(scores) === calculateAverageScore(withNulls);
            }
        ));
    });

    // P3: Array de un único valor repetido N veces → resultado es ese valor
    it('[P3] array homogéneo [x, x, x] → resultado exactamente x', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 1, max: 20 }),
            (value, count) => {
                const scores = Array<number | null>(count).fill(value);
                return calculateAverageScore(scores) === value;
            }
        ));
    });

    // P4: Array vacío o todo nulls → siempre null
    it('[P4] array sin valores válidos → null', () => {
        fc.assert(fc.property(
            fc.nat({ max: 10 }),
            (count) => {
                const allNull: (number | null)[] = Array<null>(count).fill(null);
                return calculateAverageScore(allNull) === null;
            }
        ));
    });
});

// ---------------------------------------------------------------------------
// Email VO
// ---------------------------------------------------------------------------

describe('Email VO — propiedades', () => {
    // P5: Email bien formado nunca lanza al construir
    it('[P5] email con formato válido nunca lanza en el constructor', () => {
        fc.assert(fc.property(
            validEmailArb,
            (email) => {
                expect(() => new Email(email)).not.toThrow();
            }
        ));
    });

    // P6: El valor siempre se normaliza a minúsculas
    it('[P6] email.value siempre es la versión en minúsculas del input', () => {
        fc.assert(fc.property(
            validEmailArb,
            (email) => {
                const vo = new Email(email);
                return vo.value === email.toLowerCase();
            }
        ));
    });

    // P7: Reflexividad de equals — email.equals(email) siempre true
    it('[P7] equals es reflexivo: e.equals(e) siempre true', () => {
        fc.assert(fc.property(
            validEmailArb,
            (email) => {
                const vo = new Email(email);
                return vo.equals(vo);
            }
        ));
    });

    // P8: String sin '@' siempre lanza "Invalid email"
    it('[P8] string sin @ siempre lanza "Invalid email"', () => {
        fc.assert(fc.property(
            fc.string({ maxLength: 30 }).filter(s => !s.includes('@')),
            (noAt) => {
                expect(() => new Email(noAt)).toThrow('Invalid email');
            }
        ));
    });
});

// ---------------------------------------------------------------------------
// PersonName VO
// ---------------------------------------------------------------------------

describe('PersonName VO — propiedades', () => {
    // P9: Nombre de 2-50 letras ASCII nunca lanza
    it('[P9] nombre de 2-50 letras siempre se acepta', () => {
        fc.assert(fc.property(
            validNameArb, validNameArb,
            (firstName, lastName) => {
                expect(() => new PersonName(firstName, lastName)).not.toThrow();
            }
        ));
    });

    // P10: fullName siempre es "firstName lastName"
    it('[P10] fullName siempre concatena firstName y lastName con espacio', () => {
        fc.assert(fc.property(
            validNameArb, validNameArb,
            (firstName, lastName) => {
                const pn = new PersonName(firstName, lastName);
                return pn.fullName === `${firstName} ${lastName}`;
            }
        ));
    });

    // P11: Nombre que contiene dígito siempre lanza
    it('[P11] nombre con al menos un dígito siempre lanza "Invalid name"', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 2, maxLength: 20 }).filter(s => /\d/.test(s)),
            (nameWithDigit) => {
                expect(() => new PersonName(nameWithDigit, 'García')).toThrow('Invalid name');
            }
        ));
    });
});

// ---------------------------------------------------------------------------
// PhoneNumber VO
// ---------------------------------------------------------------------------

describe('PhoneNumber VO — propiedades', () => {
    // P12: Teléfono español 9 dígitos (6/7/9) siempre válido
    it('[P12] número español (6/7/9 + 8 dígitos) siempre se acepta', () => {
        fc.assert(fc.property(
            validPhoneArb,
            (phone) => {
                expect(() => new PhoneNumber(phone)).not.toThrow();
            }
        ));
    });

    // P13: 9 dígitos que NO empieza en 6, 7 o 9 → siempre inválido
    it('[P13] número de 9 dígitos que no empieza en 6/7/9 siempre lanza "Invalid phone"', () => {
        fc.assert(fc.property(
            fc.stringMatching(/^[012345][0-9]{8}$/),
            (phone) => {
                expect(() => new PhoneNumber(phone)).toThrow('Invalid phone');
            }
        ));
    });
});

// ---------------------------------------------------------------------------
// getNextInterviewStep — propiedades de flujo de entrevista
// ---------------------------------------------------------------------------

describe('getNextInterviewStep — propiedades', () => {
    // P14: El resultado SIEMPRE tiene orderIndex mayor al del step actual
    it('[P14] el siguiente step siempre tiene orderIndex mayor al actual', () => {
        fc.assert(fc.property(
            stepsArb,
            fc.nat({ max: 9 }),
            (steps, idx) => {
                const currentStep = steps[idx % steps.length];
                const next = getNextInterviewStep(steps, currentStep.id);
                if (next === null) return true; // último step, OK
                return next.orderIndex > currentStep.orderIndex;
            }
        ));
    });

    // P15: El resultado siempre pertenece al array de steps proporcionado (nunca un step inexistente)
    it('[P15] el resultado siempre pertenece al array de steps (no se inventa un step)', () => {
        fc.assert(fc.property(
            stepsArb,
            fc.nat({ max: 9 }),
            (steps, idx) => {
                const currentStep = steps[idx % steps.length];
                const next = getNextInterviewStep(steps, currentStep.id);
                if (next === null) return true;
                return steps.some(s => s.id === next.id && s.orderIndex === next.orderIndex);
            }
        ));
    });

    // P16: Si el step actual es el ÚLTIMO (mayor orderIndex), el resultado es null
    it('[P16] si el step actual es el último del flujo, devuelve null', () => {
        fc.assert(fc.property(
            stepsArb,
            (steps) => {
                const last = steps.reduce((max, s) => s.orderIndex > max.orderIndex ? s : max);
                return getNextInterviewStep(steps, last.id) === null;
            }
        ));
    });

    // P17: currentStepId inexistente en el array → siempre null
    it('[P17] currentStepId inexistente en el flujo → devuelve null', () => {
        fc.assert(fc.property(
            stepsArb,
            fc.integer({ min: 1000, max: 9999 }), // ids fuera del rango 1-10 del arbitrary
            (steps, unknownId) => {
                return getNextInterviewStep(steps, unknownId) === null;
            }
        ));
    });

    // P18: Determinismo — mismo flujo + mismo step → siempre el mismo resultado
    it('[P18] dado el mismo flujo y el mismo step, el resultado es siempre el mismo', () => {
        fc.assert(fc.property(
            stepsArb,
            fc.nat({ max: 9 }),
            (steps, idx) => {
                const currentStep = steps[idx % steps.length];
                const r1 = getNextInterviewStep(steps, currentStep.id);
                const r2 = getNextInterviewStep(steps, currentStep.id);
                if (r1 === null && r2 === null) return true;
                if (r1 === null || r2 === null) return false;
                return r1.id === r2.id && r1.orderIndex === r2.orderIndex;
            }
        ));
    });
});
