# Spec-Kit Constitution v1.0.0

## Propósito

Este documento define las reglas de trabajo para el ejercicio backend del cohort AI4Devs. Rige cómo se diseñan, validan e implementan los endpoints del sistema LTI.

## Principios fundamentales

### 1. Contract First
El contrato HTTP (OpenAPI) precede siempre a la implementación. Ningún controller, service o route se escribe antes de que el path esté en `backend/api-spec.yaml` y validado con `@redocly/cli`.

### 2. TDD Red-Green
Los tests se escriben antes del código que los hace pasar. Un ciclo sólo avanza cuando:
- **RED**: todos los tests nuevos fallan
- El humano confirma RED escribiendo "GREEN"
- **GREEN**: la implementación hace pasar todos los tests

### 3. Capas en orden
La implementación siempre sigue el orden: domain model → service → controller → route → registro en index.ts. Nunca al revés, nunca saltando capas.

### 4. Build check por fichero
`cd backend && npm run build` se ejecuta después de escribir CADA fichero. Un error de TypeScript no viaja al siguiente fichero.

## Reglas de calidad

### Semántica null
`averageScore` (y cualquier campo de agregación sobre datos opcionales) devuelve `null` cuando no hay datos. Nunca `0`, nunca `NaN`, nunca `undefined`. La distinción entre "sin datos" y "puntuación cero" es fundamental.

### Scope
Cada PR cubre exactamente un ticket. Los cambios en `frontend/` están prohibidos en tickets de backend. Las migraciones de base de datos (`prisma migrate dev`) requieren autorización explícita del humano.

### HTTP correcto
- `400` — el cliente envió un dato inválido (ID no entero, campo faltante)
- `404` — el recurso referenciado no existe en la base de datos
- `409` — la operación viola una regla de negocio (dato válido en contexto incorrecto)
- `500` — error inesperado del servidor

### Prohibiciones
- Usar `0` o `NaN` para representar ausencia de datos
- `prisma migrate dev` sin autorización explícita
- Modificar `frontend/` en tickets de backend
- Saltarse la fase RED de tests
- Mezclar cambios de múltiples tickets en un PR

## Flujo de trabajo canónico

```
/explorar
  → /contrato <METHOD> <path>  [esperar APROBADO]
    → /tdd <METHOD> <path>     [esperar GREEN]
      → agente: backend-developer
        → agente: reviewer
          → commit
            → /log-prompt
              → /entregar
```

## Versionado

- v1.0.0 (2026-06-11) — versión inicial para cohort AI4Devs backend
