# Skill: openapi-contract

Convenciones OpenAPI 3.0.3 para el proyecto LTI. Usar siempre al añadir o modificar paths en `backend/api-spec.yaml`.

## Estructura base

```yaml
openapi: 3.0.3
info:
  title: AI4Devs LTI API
  version: 1.0.0
paths:
  /positions/{id}/candidates:
    get:
      ...
components:
  schemas:
    Error:
      type: object
      required: [message]
      properties:
        message:
          type: string
```

## Reglas del proyecto

### Path parameters
```yaml
parameters:
  - name: id
    in: path
    required: true          # SIEMPRE required: true
    schema:
      type: integer
      minimum: 1
```

### Schemas en components — siempre
Los schemas reutilizables van en `components/schemas`, nunca inline en el path:
```yaml
# CORRECTO
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/CandidateRow'

# INCORRECTO — nunca inline si es reutilizable
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            fullName:
              type: string
```

### Nullable fields
```yaml
averageScore:
  type: number
  nullable: true    # null cuando no hay entrevistas puntuadas
  example: 4.5
```

### Error schema reutilizable
Define `Error` una sola vez en `components/schemas` y referéncialo en todos los 4xx/5xx:
```yaml
components:
  schemas:
    Error:
      type: object
      required: [message]
      properties:
        message:
          type: string
          example: "Position not found"
```

### Respuestas mínimas por tipo de endpoint

**GET /:id/recursos** (lista filtrada por ID padre):
- `200` — array (puede ser vacío `[]`)
- `400` — ID inválido (`$ref: '#/components/schemas/Error'`)
- `404` — recurso padre no encontrado

**GET /:id** (recurso único):
- `200` — objeto
- `400` — ID inválido
- `404` — no encontrado

**PUT /:id/campo** (actualización de estado):
- `200` — objeto actualizado
- `400` — body inválido
- `404` — recurso no encontrado
- `409` — conflicto de estado (ej: step no pertenece al flow de la posición)

## Validación

```bash
cd backend && npx @redocly/cli lint api-spec.yaml
```

Requisito: cero errores antes de cualquier commit. Warnings son aceptables.

## Ejemplo completo — GET /positions/{id}/candidates

```yaml
/positions/{id}/candidates:
  get:
    summary: Get candidates for a position
    tags: [Positions]
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
          minimum: 1
    responses:
      '200':
        description: List of candidates in the position pipeline
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/CandidateRow'
      '400':
        description: Invalid position ID
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      '404':
        description: Position not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

components:
  schemas:
    CandidateRow:
      type: object
      required: [fullName, currentInterviewStep]
      properties:
        fullName:
          type: string
          example: "Jane Doe"
        currentInterviewStep:
          type: string
          example: "Technical Interview"
        averageScore:
          type: number
          nullable: true
          example: 4.5
    Error:
      type: object
      required: [message]
      properties:
        message:
          type: string
```
