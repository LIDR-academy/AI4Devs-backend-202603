# Prompts - Endpoints Kanban (JASS)

**Fecha:** 2026-06-10  
**LLM:** Claude Code  

---

## Descripción General

Este documento contiene 4 prompts secuenciales para implementar los endpoints Kanban del proyecto AI4Devs-backend:

1. **Análisis** — Auditoría completa del proyecto: estructura, arquitectura, capas, endpoints existentes, riesgos y deuda técnica.
2. **Planificación** — Identificación de decisiones funcionales e integridad mínima necesarias para los endpoints, sin refactor general.
3. **Implementación** — Desarrollo de los 2 endpoints (GET/PUT) respetando documentación y reglas de integridad.
4. **Pruebas (QA/Code Review)** — Validación funcional, técnica y de tests; corrección de issues encontrados.

---

## FASE 1: Análisis

### Prompt 1

**Rol:** Software Architect Senior

### Objetivo
Necesito que primero analices completamente el proyecto antes de realizar cualquier cambio.

### Tareas

1. Revisa toda la estructura del proyecto.
2. Identifica:
   - Framework utilizado.
   - Arquitectura general.
   - Capas existentes (controllers, services, repositories, models, etc.).
   - Convenciones de código.
   - Flujo de autenticación.
   - Endpoints existentes relacionados.
   - Relaciones entre tablas involucradas.
3. Genera un archivo llamado documentacion.md que incluya:
   - Descripción general del proyecto.
   - Arquitectura.
   - Estructura de carpetas.
   - Modelo de datos detectado.
   - Endpoints existentes relevantes.
   - Riesgos técnicos encontrados.
   - Posibles bugs detectados.
   - Deuda técnica encontrada.
4. No implementes ningún cambio todavía.

### Reglas

- Si existe cualquier duda sobre el dominio o la implementación, pregúntamela.
- Si detectas inconsistencias, errores o posibles bugs, documenta todo.
- No modifiques archivos de código.
- Solo genera documentacion.md.

### Entrega

Al finalizar espera instrucciones.

---

## FASE 2: Planificación

### Prompt 2

**Rol:** Software Architect Senior

### Contexto
Ya existe un archivo documentacion.md con el análisis completo del proyecto. Antes de implementar nuevos endpoints Kanban, necesitamos resolver únicamente las dudas funcionales y reglas mínimas de integridad que afectan directamente a esos endpoints.

### Objetivo

Analiza documentacion.md y el código actual, pero no implementes cambios todavía.

### Endpoints Futuros
1. GET /positions/:id/candidates
   - Debe devolver candidatos asociados a una posición.
   - Debe incluir nombre completo del candidato.
   - Debe incluir la fase actual del proceso de entrevista.
   - Debe incluir el promedio de score de entrevistas.

2. **PUT /candidates/:id/stage**
   - Debe actualizar la fase actual del candidato en el proceso de entrevista.

### Tareas
1. Revisa específicamente estas secciones de documentacion.md:
   - Relaciones entre tablas involucradas.
   - Riesgos técnicos encontrados.
   - Posibles bugs detectados.
   - Deuda técnica encontrada.

2. Determina qué puntos son relevantes directamente para los endpoints Kanban.

3. No propongas una limpieza general del proyecto.
   - Solo identifica decisiones funcionales e integridad mínima necesarias antes de implementar.
   - Evita refactors grandes.
   - Evita cambios no relacionados con estos endpoints.

4. Detecta y documenta:
   - Ambigüedades funcionales.
   - Reglas de negocio mínimas que deben definirse.
   - Validaciones obligatorias.
   - Riesgos si no se definen esas reglas.
   - Decisiones recomendadas.
   - Preguntas que debo responder antes de pasar al plan técnico.

### Consideraciones Especiales
- current_interview_step vive en Application, no en Candidate.
- Un Candidate puede tener múltiples Applications.
- Un Application pertenece a una Position.
- Una Position pertenece a un InterviewFlow.
- Un InterviewFlow tiene InterviewSteps.
- El nuevo current_interview_step debería pertenecer al InterviewFlow de la Position.
- El average score debería aclararse si se calcula por candidato global o por aplicación/posición.
- No existe estado de Application actualmente.
- No existe autenticación todavía.
- No existen repositories.
- Evitar introducir N+1 queries.

### Entregable

Genera o actualiza un archivo llamado **decision-integridad-kanban.md** con:
- Resumen del problema.
- Relaciones de datos relevantes.
- Ambigüedades detectadas.
- Reglas mínimas de integridad recomendadas.
- Decisiones técnicas recomendadas.
- Preguntas abiertas para el Product Owner o responsable funcional.
- Qué NO se recomienda atacar todavía.
- Criterios mínimos para pasar a la fase de plan técnico.

### ⚠️ Importante

- No implementes endpoints.
- No modifiques código.
- No hagas refactor.
- Solo genera/actualiza decision-integridad-kanban.md.
- Al finalizar, espera instrucciones.

---

## FASE 3: Implementación

### Prompt 3

**Rol:** Software Engineer Senior

### Contexto

Ya existen los archivos:
- documentacion.md
- decision-integridad-kanban.md

Usa ambos como referencia principal antes de implementar.

### Objetivo

Implementar los endpoints Kanban definidos, respetando las decisiones mínimas de integridad documentadas y evitando una limpieza general del proyecto.

### Endpoints a Implementar

#### 1. GET /positions/:id/candidates

Debe devolver candidatos asociados a una posición, incluyendo:
- application_id
- candidate_id
- candidate_full_name
- current_interview_step:
  - id
  - name
  - orderIndex
- average_score

Reglas:
- Buscar Applications por positionId.
- Calcular average_score solo con entrevistas de esa Application.
- Ignorar scores null.
- Si no hay scores, devolver average_score: null.
- Evitar N+1 queries.
- Si la posición no existe, devolver 404.
- Si no hay candidatos, devolver 200 con lista vacía.

#### 2. PUT /candidates/:id/stage

Debe actualizar la etapa actual del candidato.

**Nota Importante:**
Como currentInterviewStep vive en Application y un Candidate puede tener múltiples Applications, usa esta decisión:
- Mantener la ruta PUT /candidates/:id/stage.
- Requerir positionId en el body.
- Requerir interviewStepId en el body.

**Body Esperado:**

```json
{
  "positionId": 1,
  "interviewStepId": 2
}
```

**Reglas:**
- Validar candidateId numérico.
- Validar positionId numérico.
- Validar interviewStepId numérico.
- Verificar que existe una Application para candidateId + positionId.
- Si no existe, devolver 404.
- Si existe más de una Application para candidateId + positionId, devolver 409.
- Verificar que interviewStepId existe.
- Verificar que interviewStepId pertenece al interviewFlow de la Position.
- Si no pertenece, devolver 422.
- Actualizar Application.currentInterviewStep.
- Devolver la Application actualizada o un DTO claro con candidate_id, position_id y current_interview_step.

### Alcance
- No hagas refactor general.
- No implementes autenticación.
- No cambies schema Prisma.
- No agregues migraciones.
- No arregles deuda técnica no relacionada.
- No modifiques frontend salvo que sea estrictamente necesario para compilar, y si lo es, explícalo antes.
- Mantén el estilo y arquitectura actual del proyecto.

### Antes de Escribir Código

1. Revisa documentacion.md.
2. Revisa decision-integridad-kanban.md.
3. Revisa rutas, servicios y modelos actuales.
4. Define brevemente el plan de implementación.

### Implementación Esperada
- Crear los archivos mínimos necesarios.
- Reutilizar Prisma de forma pragmática.
- Agregar rutas nuevas:
  - /positions/:id/candidates
  - /candidates/:id/stage
- Agregar servicios/controladores si corresponde según el patrón actual.
- Agregar validaciones básicas.
- Agregar manejo de errores consistente.
- Evitar N+1 queries.

### Tests

- Agrega tests unitarios o de integración si la estructura actual lo permite sin reestructurar todo.
- Si no es viable por la estructura actual, explica qué quedó pendiente y por qué.
- Al menos intenta ejecutar:
  - `npm run build` en backend
  - `npm test` si aplica

### Entrega
- Lista de archivos modificados/creados.
- Resumen de la implementación.
- Validaciones implementadas.
- Comandos ejecutados y resultado.
- Riesgos o pendientes.

---

## FASE 4: Pruebas (QA/Code Review)

### Prompt 4

**Rol:** Software Architect Senior y Code Reviewer

### Contexto

Ya se implementaron los endpoints Kanban:
- GET /positions/:id/candidates
- PUT /candidates/:id/stage

**Archivos de referencia:**
- documentacion.md
- decision-integridad-kanban.md

### Objetivo

Realizar QA técnico y code review completo de la implementación antes de aprobarla.

**Nota:** No implementes cambios al inicio. Primero revisa.

### Tareas

#### 1. Revisión Funcional

**Verifica que GET /positions/:id/candidates:**
- Devuelve solo candidatos asociados a la posición.
- Incluye application_id.
- Incluye candidate_id.
- Incluye candidate_full_name.
- Incluye current_interview_step con id, name y orderIndex.
- Calcula average_score por Application, no global por Candidate.
- Ignora scores null.
- Devuelve average_score null si no hay scores.
- Devuelve 404 si la posición no existe.
- Devuelve 200 con lista vacía si no hay candidatos.

**Verifica que PUT /candidates/:id/stage:**
- Requiere positionId en body.
- Requiere interviewStepId en body.
- Valida candidateId, positionId e interviewStepId.
- Busca Application por candidateId + positionId.
- Devuelve 404 si no existe.
- Devuelve 409 si hay múltiples Applications para el mismo candidateId + positionId.
- Verifica que interviewStepId exista.
- Verifica que interviewStepId pertenezca al interviewFlow de la Position.
- Devuelve 422 si el step no pertenece al flujo.
- Actualiza Application.currentInterviewStep.
- Devuelve un DTO claro.

#### 2. Revisión Técnica

**Evalúa:**
- Consistencia con la arquitectura actual.
- Si se evitó una limpieza general innecesaria.
- Si se evitó N+1 queries.
- Si el manejo de errores es correcto.
- Si hay breaking changes en endpoints existentes.
- Si hay riesgos de concurrencia.
- Si se introdujeron nuevos PrismaClient innecesarios.
- Si los nombres de campos son consistentes.
- Si la implementación respeta documentacion.md y decision-integridad-kanban.md.

#### 3. Revisión de Tests

**Verifica:**
- Tests agregados.
- Casos cubiertos.
- Casos faltantes.
- Si los tests realmente prueban reglas de integridad.
- Si build y tests pasan.

#### 4. Verificación Local

**Ejecuta, si aplica:**
- npm run build en backend.
- npm test en backend.
- Pruebas manuales o scripts mínimos contra los endpoints si hay servidor/DB disponible.
- Revisa git diff.

#### 5. Reporte de Code Review

**Entrega findings primero, ordenados por severidad:**
- P0: bloqueante.
- P1: alto.
- P2: medio.
- P3: bajo.

Para cada finding incluye:
- Archivo y línea.
- Problema.
- Impacto.
- Recomendación concreta.

Si no hay findings bloqueantes, indícalo claramente.

#### 6. Correcciones

**Después del review:**
- Si encuentras issues P0 o P1, corrígelos.
- Si encuentras P2/P3, corrige solo los que sean pequeños y directamente relacionados.
- No hagas refactor general.
- No cambies alcance funcional sin justificarlo.

### Entrega Final
- Estado de aprobación: aprobado / aprobado con observaciones / no aprobado.
- Findings encontrados.
- Cambios realizados durante QA, si hubo.
- Comandos ejecutados y resultado.
- Riesgos residuales.
- Recomendación final.

