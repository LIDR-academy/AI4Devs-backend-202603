---
description: "Diseño contract-first: añade el endpoint a api-spec.yaml antes de cualquier implementación"
argument-hint: "<METHOD> <path> — ej: GET /positions/:id/candidates"
---

Recibe el endpoint como argumento (ej: `/contrato GET /positions/:id/candidates`). Actualiza `backend/api-spec.yaml` siguiendo OpenAPI 3.0.3.

## Reglas

- Usa el skill `openapi-contract` para todas las convenciones del proyecto.
- Los schemas reutilizables van siempre en `components/schemas`, nunca inline.
- Path params numéricos: `required: true`, `schema: { type: integer, minimum: 1 }`.
- Respuestas mínimas: **200** (o 201), **400**, **404**. Añade **409** sólo si aplica conflicto de estado.
- `nullable: true` para campos que pueden ser null (ej: `averageScore`).
- El schema `Error` con `{ message: string }` es reutilizable — defínelo una sola vez en `components/schemas/Error`.

## Flujo

1. Lee `backend/api-spec.yaml` para conocer el estado actual.
2. Añade el path y sus operaciones al YAML.
3. Define o reutiliza schemas en `components/schemas`.
4. Valida con:
   ```bash
   cd backend && npx @redocly/cli lint api-spec.yaml
   ```
5. Muestra el **diff completo** del fichero.
6. **PAUSA** — el humano debe escribir "APROBADO" para continuar. No implementes hasta recibir esa confirmación.
