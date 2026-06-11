# Decision de integridad para endpoints Kanban

## 1. Resumen del problema

Se necesitan dos endpoints para una interfaz Kanban de candidatos:

- `GET /positions/:id/candidates`: listar candidatos asociados a una posicion, incluyendo nombre completo, etapa actual del proceso y promedio de score de entrevistas.
- `PUT /candidates/:id/stage`: actualizar la etapa actual de entrevista de un candidato.

El punto critico es que la etapa actual no vive en `Candidate`; vive en `Application.currentInterviewStep`. Por lo tanto, cualquier actualizacion de etapa debe identificar una postulacion concreta, no solo un candidato.

La regla minima de integridad es evitar que un candidato sea movido a un `InterviewStep` que no pertenece al `InterviewFlow` de la `Position` asociada a su `Application`.

Este documento no propone una limpieza general del proyecto. Solo define las decisiones funcionales e integridad minima necesarias para poder pasar a una fase posterior de plan tecnico.

## 2. Relaciones de datos relevantes

Para estos endpoints, las tablas relevantes son:

```text
Position
└── Application[]
    ├── Candidate
    ├── InterviewStep actual, via Application.currentInterviewStep
    └── Interview[]
        └── score

Position
└── InterviewFlow
    └── InterviewStep[]
```

Lectura clave:

- `Position.id` identifica la vacante.
- `Application.positionId` conecta una postulacion con una posicion.
- `Application.candidateId` conecta la postulacion con un candidato.
- `Application.currentInterviewStep` representa la etapa actual del candidato dentro de esa postulacion.
- `Position.interviewFlowId` define el flujo valido para esa posicion.
- `InterviewStep.interviewFlowId` permite verificar si una etapa pertenece al flujo de la posicion.
- `Interview.applicationId` permite calcular score promedio por postulacion.

Implicacion principal:

- Si un candidato tiene varias `Application`, `candidateId` por si solo no identifica de forma segura que etapa actualizar.

## 3. Puntos relevantes detectados desde `documentacion.md`

### Relaciones entre tablas involucradas

Son directamente relevantes. En particular:

- No hay constraint unico para evitar duplicados de `Application(candidateId, positionId)`.
- No hay constraint que garantice que `Application.currentInterviewStep` pertenezca al `InterviewFlow` de la `Position`.
- No hay constraint que garantice unicidad de `InterviewStep.orderIndex` dentro de un mismo `InterviewFlow`.

Decision recomendada:

- Validar estas reglas desde el endpoint/servicio en esta fase.
- No crear migraciones todavia salvo que el Product Owner confirme que la integridad debe quedar reforzada a nivel base de datos.

### Riesgos tecnicos encontrados

Relevantes para estos endpoints:

- Multiples instancias de `PrismaClient`.
- Ausencia de repositorios.
- Contratos inconsistentes entre rutas, controllers y OpenAPI.
- Falta de pruebas.
- Mezcla de responsabilidades.

Decision recomendada:

- No hacer refactor general antes de implementar.
- Para los nuevos endpoints, evitar agrandar la deuda: definir una ruta clara, un servicio pequeno, validaciones explicitas y consultas Prisma agregadas en lugar de loops con queries por candidato.

### Posibles bugs detectados

Relevantes para estos endpoints:

- `GET /candidates/:id` puede perder relaciones por diferencia de nombres (`educations` vs `education`, `workExperiences` vs `workExperience`). No afecta directamente si el nuevo endpoint consulta `Application` con `include`/`select` y arma DTO propio.
- `InterviewStep.orderIndex` duplicado en seed puede afectar el orden del Kanban si se ordenan columnas por `orderIndex`.
- Errores de infraestructura devueltos como 400 pueden repetirse si se copia el patron actual sin criterio.

Decision recomendada:

- No reutilizar `Candidate.findOne` para el endpoint Kanban.
- Construir un DTO especifico para Kanban.
- Ordenar las etapas por `orderIndex` y luego por `id` como fallback si hay duplicados, hasta que se confirme si se corrige el seed o se agrega constraint.

### Deuda tecnica encontrada

Relevante como contexto, pero no debe bloquear los endpoints:

- Falta de repositorios.
- Falta de DTOs formales.
- Falta de autenticacion.
- Falta de contrato OpenAPI sincronizado.
- Falta de tests.

Decision recomendada:

- Atacar solo lo minimo: DTOs/shape de respuesta para estos endpoints, validaciones de integridad y tests focalizados.
- No introducir autenticacion, repositorios globales, migraciones amplias ni reestructuracion de carpetas en esta fase.

## 4. Ambiguedades funcionales detectadas

### A. `PUT /candidates/:id/stage` no identifica una postulacion

El endpoint propuesto recibe solo `candidateId` en path. Pero `currentInterviewStep` vive en `Application` y un candidato puede tener multiples aplicaciones.

Riesgo:

- Se podria actualizar la aplicacion equivocada.
- Si un candidato aplica a dos posiciones, no hay forma deterministica de saber cual Kanban se esta modificando.

Decision recomendada:

- Incluir `positionId` en el body del `PUT`, o cambiar el endpoint a una ruta que identifique posicion y candidato.

Opciones:

- Mantener ruta: `PUT /candidates/:id/stage` con body `{ "positionId": number, "interviewStepId": number }`.
- Alternativa mas explicita: `PUT /positions/:positionId/candidates/:candidateId/stage` con body `{ "interviewStepId": number }`.
- Alternativa mas precisa a nivel modelo: `PUT /applications/:id/stage` con body `{ "interviewStepId": number }`.

Recomendacion:

- Para Kanban por posicion, la opcion mas clara es `PUT /positions/:positionId/candidates/:candidateId/stage`.
- Si se debe respetar exactamente `PUT /candidates/:id/stage`, entonces `positionId` debe ser obligatorio en el body.

### B. Calculo de `average score`

La frase "promedio del candidato" puede interpretarse de dos formas:

- Promedio global de todas las entrevistas del candidato en todas sus aplicaciones.
- Promedio solo de entrevistas de la aplicacion del candidato a la posicion solicitada.

Riesgo:

- En un Kanban por posicion, un promedio global mezclaria evaluaciones de otras vacantes y podria ser funcionalmente incorrecto.

Decision recomendada:

- Para `GET /positions/:id/candidates`, calcular `average_score` solo con entrevistas de la `Application` asociada a esa `Position`.

### C. Forma de `current_interview_step`

No esta definido si debe devolverse:

- Solo ID del paso.
- Nombre del paso.
- Objeto con `id`, `name` y `orderIndex`.

Riesgo:

- El frontend podria necesitar el ID para mover tarjetas y el nombre para mostrar columnas.

Decision recomendada:

- Devolver un objeto:

```json
{
  "current_interview_step": {
    "id": 1,
    "name": "Initial Screening",
    "orderIndex": 1
  }
}
```

### D. Candidatos sin entrevistas

No esta definido si el promedio debe ser `null`, `0` o no incluirse.

Riesgo:

- `0` puede confundirse con una mala evaluacion real.

Decision recomendada:

- Devolver `average_score: null` cuando no hay entrevistas con score.

### E. Scores nulos

`Interview.score` es nullable.

Riesgo:

- Incluir `null` como cero distorsiona el promedio.

Decision recomendada:

- Calcular promedio solo con entrevistas donde `score` no sea `null`.

### F. Estado de aplicacion

No existe `Application.status`.

Riesgo:

- El Kanban no puede distinguir candidatos activos, rechazados, contratados o retirados.

Decision recomendada:

- Para la primera version, listar todas las aplicaciones de la posicion.
- No agregar `status` ahora salvo que Producto confirme que el Kanban debe filtrar por estado.

### G. Orden del Kanban

`InterviewStep.orderIndex` puede estar duplicado en seed.

Riesgo:

- Columnas o etapas pueden aparecer en orden inestable.

Decision recomendada:

- Para consultas, ordenar por `orderIndex ASC, id ASC`.
- Documentar que la duplicidad debe corregirse si el orden de flujo es parte del contrato funcional.

## 5. Reglas minimas de integridad recomendadas

1. Para listar candidatos por posicion:
   - La `Position` debe existir.
   - Se deben listar `Application` con `positionId = :id`.
   - Cada resultado debe usar datos de `Application`, `Candidate`, `InterviewStep` e `Interview`.
   - El promedio debe calcularse por `Application`, no por candidato global.
   - Scores `null` no deben participar en el promedio.

2. Para actualizar etapa:
   - El `candidateId` debe ser numerico y existir.
   - La `Application` especifica debe existir.
   - Si la ruta no incluye `positionId`, el body debe incluirlo.
   - La aplicacion debe corresponder al par `candidateId + positionId`.
   - El `interviewStepId` nuevo debe existir.
   - El `interviewStepId` nuevo debe pertenecer al mismo `interviewFlowId` de la `Position` de la aplicacion.
   - No se debe actualizar si la etapa pertenece a otro flujo.

3. Para evitar ambiguedad:
   - Si existen multiples `Application` para el mismo `candidateId + positionId`, el endpoint debe devolver error de conflicto hasta que exista una regla de negocio o constraint.

4. Para concurrencia:
   - La actualizacion debe hacerse con condicion suficientemente especifica: aplicacion concreta o par `candidateId + positionId`.
   - La respuesta debe devolver la etapa final actualizada.

## 6. Validaciones obligatorias

### `GET /positions/:id/candidates`

- `id` debe ser entero positivo.
- Si la posicion no existe, responder `404`.
- Si no hay candidatos, responder `200` con lista vacia.

### `PUT /candidates/:id/stage`

Si se mantiene la ruta original:

- `id` debe ser entero positivo.
- Body debe incluir `positionId`.
- Body debe incluir `interviewStepId` o `current_interview_step`, pero se recomienda `interviewStepId` por consistencia con el schema.
- `positionId` debe ser entero positivo.
- `interviewStepId` debe ser entero positivo.
- Debe existir una aplicacion para `candidateId + positionId`.
- Debe existir el paso de entrevista.
- El paso debe pertenecer al flujo de entrevista de la posicion.

Errores recomendados:

- `400`: parametros invalidos o body incompleto.
- `404`: candidato, posicion, aplicacion o paso no encontrado.
- `409`: multiples aplicaciones para el mismo candidato y posicion, o conflicto de integridad funcional.
- `422`: etapa valida como entidad, pero no pertenece al flujo de esa posicion.
- `500`: error inesperado o infraestructura.

## 7. Decisiones tecnicas recomendadas

1. Crear DTO propio para respuesta Kanban.

Forma recomendada:

```json
{
  "position_id": 1,
  "candidates": [
    {
      "candidate_id": 1,
      "application_id": 1,
      "candidate_full_name": "John Doe",
      "current_interview_step": {
        "id": 2,
        "name": "Technical Interview",
        "orderIndex": 2
      },
      "average_score": 4.5
    }
  ]
}
```

2. Evitar reutilizar `Candidate.findOne`.

Motivo:

- Ese modelo transforma nombres de relaciones de forma insegura para este caso.
- El endpoint Kanban necesita datos de `Application`, no solo de `Candidate`.

3. Evitar N+1 queries.

Opciones aceptables:

- Una consulta Prisma sobre `application.findMany` con `where: { positionId }` e `include/select` de `candidate`, `interviewStep` e `interviews`.
- O una consulta agregada adicional para scores agrupados por `applicationId`, si se prefiere que el promedio lo calcule la base de datos.

4. Mantener alcance pequeno.

Se puede agregar una ruta nueva y un servicio especifico, sin introducir repositorios globales ni reestructurar arquitectura.

5. Nombrado.

Internamente Prisma usa `currentInterviewStep`. Para API, se puede exponer `current_interview_step` porque el requisito lo pide asi. Conviene documentar el mapeo.

6. Base de datos.

No se recomiendan migraciones obligatorias antes de la primera implementacion, pero si se debe validar integridad en el servicio.

Migraciones futuras recomendables:

- Unique compuesto para `Application(candidateId, positionId)` si el negocio prohibe duplicados.
- Unique compuesto para `InterviewStep(interviewFlowId, orderIndex)` si el flujo requiere orden unico.

## 8. Riesgos si no se definen estas reglas

- Se puede mover un candidato en la aplicacion incorrecta.
- Se puede asignar una etapa de entrevista de otro flujo.
- El promedio de score puede mezclar evaluaciones de distintas posiciones.
- El Kanban puede mostrar columnas en orden inestable.
- El endpoint puede introducir N+1 queries si calcula entrevistas por candidato en loops.
- Se pueden devolver contratos ambiguos que luego rompan el frontend.
- Si hay duplicados de aplicacion, el update podria ser no deterministico.

## 9. Preguntas abiertas para Product Owner o responsable funcional

1. Para `PUT /candidates/:id/stage`, ¿se puede cambiar la ruta a `PUT /positions/:positionId/candidates/:candidateId/stage`?

2. Si la ruta debe mantenerse como `PUT /candidates/:id/stage`, ¿confirmas que `positionId` sera obligatorio en el body?

3. ¿El `average_score` debe calcularse solo con entrevistas de la aplicacion a esa posicion?

4. Cuando no hay entrevistas con score, ¿la respuesta debe usar `average_score: null`?

5. ¿Un candidato puede aplicar mas de una vez a la misma posicion?

6. ¿El Kanban debe mostrar todas las aplicaciones de una posicion o solo aplicaciones activas/en proceso?

7. ¿Hay estados funcionales esperados como rechazado, contratado, retirado o pausado?

8. ¿El movimiento de etapa debe permitir saltos hacia adelante/atras o solo avanzar segun `orderIndex`?

9. ¿Se debe registrar historial de movimientos de etapa?

10. ¿El orden de columnas debe depender estrictamente de `InterviewStep.orderIndex`?

## 10. Que NO se recomienda atacar todavia

- Refactor general de arquitectura.
- Crear una capa completa de repositorios para todo el proyecto.
- Centralizar todos los `PrismaClient` existentes.
- Implementar autenticacion/autorizacion.
- Redisenar OpenAPI completo.
- Corregir toda la deuda del frontend.
- Cambiar el flujo de upload/CV.
- Agregar `Application.status` sin decision funcional.
- Crear migraciones de constraints sin confirmar reglas de negocio.
- Reescribir modelos de dominio existentes.

## 11. Criterios minimos para pasar a la fase de plan tecnico

Antes de planificar implementacion, deben quedar respondidas estas decisiones:

1. Como identificar una `Application` en el update de etapa:
   - `positionId` en body, ruta con `positionId`, o `applicationId`.

2. Alcance del promedio de score:
   - Recomendado: por aplicacion/posicion.

3. Respuesta cuando no hay score:
   - Recomendado: `null`.

4. Validacion de etapa:
   - Recomendado: exigir que el `InterviewStep` pertenezca al `InterviewFlow` de la `Position`.

5. Comportamiento ante multiples aplicaciones del mismo candidato a la misma posicion:
   - Recomendado: `409 Conflict` hasta tener constraint o regla funcional.

6. Alcance de listado:
   - Todas las aplicaciones de la posicion o solo subconjunto por estado.

Con esas respuestas, ya se puede construir el plan tecnico detallado sin abrir una limpieza general del proyecto.
