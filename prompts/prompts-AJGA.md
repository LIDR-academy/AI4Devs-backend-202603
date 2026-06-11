# Prompt 1: Analizar el proyecto

## Prompt original:
Reescribe el siguiente prompt usando buenas prácticas de ingeniería de prompts:
Analiza el backend de este repositorio y explícame solo lo necesario para implementar dos endpoints relacionados con candidatos, posiciones, aplicaciones e entrevistas.

Necesito saber:

- estructura del backend
- dónde están rutas, controladores, servicios/repositorios
- qué ORM o cliente SQL se usa
- modelos o tablas relacionadas con positions, candidates, applications e interviews
- relaciones entre esas entidades
- endpoints existentes que pueda imitar

No escribas código todavía.

## Meta prompt:

Eres un arquitecto de software senior especializado en backends Node.js/TypeScript. Tu tarea es analizar **solo** el backend de este repositorio y entregar un mapa de contexto mínimo pero accionable para implementar **dos nuevos endpoints** que involucren **candidates**, **positions**, **applications** e **interviews**.

## Objetivo

Explicar cómo está organizado el backend y qué piezas existentes deben reutilizarse o imitarse antes de diseñar esos dos endpoints. La respuesta debe orientar **dónde** y **cómo** encajarían en la arquitectura actual, sin implementarlos.

## Alcance

- Analiza únicamente `backend/`, `backend/prisma/`, `backend/api-spec.yaml` y documentación relacionada en `docs/`.
- Céntrate en lo necesario para dos endpoints del dominio de reclutamiento; omite detalles irrelevantes del resto del sistema.
- Basa la respuesta en hechos verificables del código y del schema; no inventes rutas, modelos ni patrones inexistentes.
- Omite frontend, despliegue, Docker y configuración general salvo que impacten directamente en el backend.
- **No escribas código**, pseudocódigo, snippets, tests ni propuestas de implementación.

## Información requerida

Responde de forma concisa y estructurada:

### 1. Estructura del backend

- Capas o carpetas principales y responsabilidad de cada una.
- Flujo típico de una petición HTTP: ruta → controlador → servicio → persistencia.

### 2. Ubicación de componentes clave

- **Rutas**: archivos, convención de nombres y cómo se montan en la aplicación.
- **Controladores**: ubicación y patrón de uso.
- **Servicios / repositorios / modelos de dominio**: ubicación y forma de acceder a la base de datos.

### 3. Persistencia

- ORM o cliente SQL utilizado.
- Ubicación del schema y cómo se instancia el cliente de BD en la app.

### 4. Modelos y tablas relevantes

Para **Position**, **Candidate**, **Application** e **Interview** (y entidades directamente relacionadas):

- Nombre del modelo/tabla en Prisma.
- Campos principales y claves foráneas.
- Relaciones entre ellas (cardinalidad y dirección).

### 5. Endpoints de referencia

- Endpoints HTTP ya implementados que sirvan como patrón a imitar.
- Para cada uno: método, ruta, capas involucradas y breve descripción de su comportamiento.
- Indica qué convenciones de ese patrón conviene replicar al crear los dos nuevos endpoints.

## Formato de salida

- Usa markdown con los encabezados anteriores.
- Incluye **rutas de archivo** concretas siempre que sea posible.
- Resume cada punto en 1–3 frases; evita párrafos largos.
- Si algo no existe en el repositorio, indícalo explícitamente en lugar de asumirlo.
- Guarda el resultado en `backend/docs/`.

## Criterios de calidad

La respuesta es correcta si un desarrollador puede, con ella, ubicar dónde y con qué patrones implementar dos endpoints del dominio de reclutamiento sin explorar todo el repositorio y sin necesitar código en esta fase.

---

# Prompt 2: Especificaciones técnicas de los endpoints

## Prompt original:
Reescribe el siguiente prompt usando buenas prácticas de ingeniería de prompts:
Define una especificación técnica breve y clara para implementar los siguientes endpoints teniendo en cuenta la documentación acerca del backend en @backend/docs/

GET /positions/:id/candidates

Debe devolver los candidatos en proceso para una posición concreta, incluyendo:

- id del candidato
- nombre completo del candidato desde candidate
- current_interview_step desde application
- puntuación media calculada desde interview

PUT /candidates/:id/stage

Debe actualizar la etapa actual del proceso de entrevista de un candidato.

Incluye:

- contrato de entrada y salida de cada endpoint
- validaciones mínimas
- errores esperados
- archivos a modificar
- criterios de aceptación

## Meta prompt:

Eres un arquitecto de APIs senior especializado en backends Node.js/TypeScript con Prisma. Tu tarea es redactar una **especificación técnica breve y accionable** para implementar dos endpoints del dominio de reclutamiento, **sin escribir código**.

## Contexto obligatorio

Antes de redactar, lee y usa como fuente de verdad:

- `backend/docs/backend-context-map.md` — arquitectura, modelos, relaciones y convenciones existentes
- `backend/prisma/schema.prisma` — nombres de campos, FKs y relaciones
- `backend/api-spec.yaml` — estilo de contrato OpenAPI del proyecto
- Endpoints de referencia ya implementados (`GET /candidates/:id`, `POST /candidates`)

Alinea la especificación con los patrones del repositorio (capas route → controller → service → domain model). No inventes estructuras ni campos que no existan en el schema.

## Objetivo

Producir un documento de especificación que permita a un desarrollador implementar ambos endpoints sin ambigüedades relevantes.

## Endpoints a especificar

### 1. `GET /positions/:id/candidates`

Lista los candidatos **en proceso** para una posición concreta. Cada elemento debe incluir:

| Dato | Origen |
|---|---|
| `id` del candidato | `Candidate.id` |
| Nombre completo | `Candidate.firstName` + `Candidate.lastName` |
| Etapa actual del proceso | `Application.currentInterviewStep` (resolver qué información del paso devolver: id, nombre u otros campos de `InterviewStep`) |
| Puntuación media | Media aritmética de `Interview.score` asociadas a la `Application` de ese candidato para esa posición |

**Decisiones que debes explicitar en la spec:**

- Qué significa exactamente "en proceso" (p. ej. candidatos con `Application` activa para esa `positionId`).
- Cómo calcular la media si no hay entrevistas o si algún `score` es `null`.
- Formato de respuesta cuando la posición existe pero no tiene candidatos (lista vacía vs error).

### 2. `PUT /candidates/:id/stage`

Actualiza la etapa actual del proceso de entrevista de un candidato.

**Decisiones que debes explicitar en la spec:**

- Qué campo(s) del body identifican la candidatura a actualizar (p. ej. `positionId`, `applicationId`).
- Qué campo del body recibe la nueva etapa (p. ej. `interviewStepId` → `Application.currentInterviewStep`).
- Cómo validar que el nuevo paso pertenece al `InterviewFlow` de la posición.
- Qué recurso se devuelve en la respuesta tras la actualización.

## Contenido obligatorio de la especificación

Para **cada endpoint**, documenta:

### A. Contrato de entrada y salida

- Parámetros de ruta, query y body (si aplica) con tipos y obligatoriedad.
- Ejemplo JSON de request y response (éxito).
- Convención de nombres: usa **camelCase** en JSON salvo que el proyecto indique lo contrario.
- Códigos HTTP de éxito.

### B. Validaciones mínimas

- Validación de IDs numéricos.
- Existencia de recursos relacionados (`Position`, `Candidate`, `Application`, `InterviewStep`).
- Reglas de negocio imprescindibles (p. ej. paso válido para el flujo de la posición).

### C. Errores esperados

- Tabla con: código HTTP, condición, mensaje de error y cuerpo de respuesta.
- Cubre al menos: `400`, `404` y `500` cuando aplique.

### D. Archivos a crear o modificar

- Lista concreta de archivos en `backend/src/` y `backend/api-spec.yaml`.
- Indica si cada archivo se **crea** o **modifica** y su responsabilidad.

### E. Criterios de aceptación

- Lista verificable en formato "Dado / Cuando / Entonces" o checklist concreto.
- Incluye casos de éxito, lista vacía, recurso no encontrado y validación fallida.

## Restricciones

- **No escribas código** ni pseudocódigo de implementación.
- No modifiques el schema de Prisma salvo que detectes un bloqueo real; si lo detectas, documéntalo como riesgo, no como cambio.
- No incluyas frontend, tests ni despliegue.
- Sé breve: la spec completa no debe superar ~150 líneas.

## Formato de salida

Usa markdown con esta estructura:

```
# Especificación técnica: endpoints de reclutamiento

## Resumen
## GET /positions/:id/candidates
### Contrato
### Validaciones
### Errores
### Archivos
### Criterios de aceptación

## PUT /candidates/:id/stage
### Contrato
### Validaciones
### Errores
### Archivos
### Criterios de aceptación

## Archivos compartidos
## Riesgos o supuestos abiertos
```

Guarda el resultado en `backend/docs/endpoints-spec.md`.

## Criterio de calidad

La especificación es correcta si un desarrollador puede implementar ambos endpoints leyendo solo ese documento y el mapa de contexto, sin necesitar aclaraciones adicionales sobre contratos, validaciones o ubicación de archivos.

---

# Prompt 3: Implementar endpoints

## Prompt original:
Reescribe el siguiente prompt usando buenas prácticas de ingeniería de prompts:
Implementa estos dos endpoints siguiendo la arquitectura existente del backend y el documento @backend/docs/endpoints-spec.md:

GET /positions/:id/candidates
PUT /candidates/:id/stage

Restricciones:

- no cambies endpoints existentes
- usa el mismo estilo de rutas, controladores y servicios/repositorios del proyecto
- separa la lógica si el proyecto ya usa capas
- mantén nombres claros y relacionados con el dominio

## Meta prompt:

Eres un desarrollador backend senior especializado en Node.js, Express y TypeScript con Prisma. Tu tarea es **implementar** dos endpoints del dominio de reclutamiento siguiendo fielmente la especificación técnica y la arquitectura existente del repositorio.

## Contexto obligatorio

Lee antes de codificar:

- `backend/docs/endpoints-spec.md` — contrato, validaciones, errores, archivos y criterios de aceptación (fuente de verdad funcional)
- `backend/docs/backend-context-map.md` — estructura de capas, convenciones y patrones del proyecto
- Código de referencia: `candidateRoutes.ts`, `candidateController.ts`, `candidateService.ts`, `Candidate.ts`

## Objetivo

Implementar:

1. `GET /positions/:id/candidates`
2. `PUT /candidates/:id/stage`

Ambos deben cumplir contrato, validaciones y códigos HTTP definidos en `endpoints-spec.md`.

## Restricciones

- **No modifiques** el comportamiento de endpoints existentes (`POST /candidates`, `GET /candidates/:id`, `POST /upload`, `GET /`).
- **No cambies** `backend/prisma/schema.prisma` ni generes migraciones.
- Respeta el flujo de capas del proyecto: `routes` → `controllers` → `services` → `domain/models`.
- Usa nombres de dominio claros (p. ej. `getCandidatesInProcess`, `updateCandidateStage`, `findByCandidateAndPosition`).
- Persistencia vía clases de `domain/models/` con Prisma, como en el resto del backend.
- Convención JSON en **camelCase** y formato de errores `{ "error": "..." }` según la spec.
- Registra `PUT /:id/stage` **antes** de `GET /:id` en `candidateRoutes.ts` para evitar conflicto de rutas.

## Alcance de la implementación

### Endpoint 1: `GET /positions/:id/candidates`

- Crear capa de rutas, controlador y servicio de `Position`.
- Consultar candidatos con `Application` para la posición indicada.
- Mapear respuesta con `candidateId`, `fullName`, `currentInterviewStep` y `averageScore` según reglas de la spec.
- Devolver `200` con lista vacía si la posición existe sin candidaturas.

### Endpoint 2: `PUT /candidates/:id/stage`

- Extender rutas, controlador y servicio de `Candidate` existentes.
- Validar body `{ positionId, interviewStepId }` en `validator.ts`.
- Actualizar `Application.currentInterviewStep` tras validar existencia de recursos y pertenencia del paso al flujo de la posición.

## Archivos esperados

| Acción | Archivo |
|---|---|
| Crear | `backend/src/routes/positionRoutes.ts` |
| Crear | `backend/src/presentation/controllers/positionController.ts` |
| Crear | `backend/src/application/services/positionService.ts` |
| Modificar | `backend/src/routes/candidateRoutes.ts` |
| Modificar | `backend/src/presentation/controllers/candidateController.ts` |
| Modificar | `backend/src/application/services/candidateService.ts` |
| Modificar | `backend/src/application/validator.ts` |
| Modificar | `backend/src/domain/models/Position.ts` |
| Modificar | `backend/src/domain/models/Application.ts` |
| Modificar | `backend/src/domain/models/InterviewStep.ts` (si hace falta para validar flujo) |
| Modificar | `backend/src/index.ts` |
| Modificar | `backend/api-spec.yaml` |

## Verificación

Tras implementar:

1. Compila sin errores de TypeScript (`npm run build` en `backend/`).
2. Comprueba manualmente o describe cómo probar cada criterio de aceptación de `endpoints-spec.md`.
3. Confirma que los endpoints existentes no han cambiado de comportamiento.

## Formato de respuesta

Al terminar, resume:

```
## Implementación completada
### Archivos creados
### Archivos modificados
### Cómo probar
### Criterios de aceptación cubiertos
### Notas o desviaciones (si las hay)
```

## Criterio de calidad

La implementación es correcta si ambos endpoints funcionan según `endpoints-spec.md`, respetan la arquitectura y convenciones del repositorio, y no introducen regresiones en endpoints existentes.

---

# Prompt 4: Revisión de implementación

## Prompt original:
Reescribe el siguiente prompt usando buenas prácticas de ingeniería de prompts:
Revisa la implementación de:

GET /positions/:id/candidates
PUT /candidates/:id/stage

Comprueba que cumple los criterios de aceptación y que gestiona correctamente los casos límite.

Revisa:

- id de position válido
- position no encontrada
- candidate no encontrado
- current_interview_step obligatorio
- respuesta coherente cuando no hay entrevistas
- errores de base de datos
- respuestas HTTP coherentes con el estilo del backend

No hagas refactors grandes.
No añadas dependencias nuevas.

## Meta prompt:

Eres un revisor senior de backends Node.js/TypeScript. Tu tarea es **auditar** la implementación de dos endpoints, verificar el cumplimiento de la especificación y **corregir solo los fallos encontrados** con cambios mínimos.

## Contexto obligatorio

Lee antes de revisar:

- `backend/docs/endpoints-spec.md` — contrato, validaciones, errores y criterios de aceptación (fuente de verdad)
- `backend/docs/backend-context-map.md` — convenciones de arquitectura y estilo HTTP del proyecto
- Implementación en:
  - `backend/src/routes/positionRoutes.ts`
  - `backend/src/routes/candidateRoutes.ts`
  - `backend/src/presentation/controllers/positionController.ts`
  - `backend/src/presentation/controllers/candidateController.ts`
  - `backend/src/application/services/positionService.ts`
  - `backend/src/application/services/candidateService.ts`
  - `backend/src/application/validator.ts`
  - `backend/src/domain/models/Position.ts`
  - `backend/src/domain/models/Application.ts`

## Objetivo

Confirmar que `GET /positions/:id/candidates` y `PUT /candidates/:id/stage` cumplen los criterios de aceptación de `endpoints-spec.md` y manejan correctamente los casos límite listados abajo. Si detectas incumplimientos, aplícalos con el **mínimo diff** necesario.

## Casos límite a verificar

### `GET /positions/:id/candidates`

| Caso | Resultado esperado |
|---|---|
| `:id` numérico y positivo válido | `200` con estructura `{ positionId, candidates }` |
| `:id` no numérico o ≤ 0 | `400` `{ "error": "Invalid ID format" }` |
| Posición inexistente | `404` `{ "error": "Position not found" }` |
| Posición sin candidaturas | `200` con `"candidates": []` |
| Candidato sin entrevistas con `score` | `averageScore: null` |
| Candidato con entrevistas puntuadas | `averageScore` = media redondeada a 1 decimal |
| Error inesperado de BD/servidor | `500` `{ "error": "Internal Server Error" }` |

### `PUT /candidates/:id/stage`

| Caso | Resultado esperado |
|---|---|
| `:id` no numérico o ≤ 0 | `400` `{ "error": "Invalid ID format" }` |
| Body sin `positionId` o sin `interviewStepId` | `400` con mensaje descriptivo |
| `interviewStepId` ausente o inválido (equivale a *current interview step obligatorio*) | `400` |
| Candidato inexistente | `404` `{ "error": "Candidate not found" }` |
| Posición inexistente | `404` `{ "error": "Position not found" }` |
| Candidatura inexistente | `404` `{ "error": "Application not found" }` |
| Paso de entrevista de otro flujo | `400` con mensaje de paso inválido |
| Actualización válida | `200` con `currentInterviewStep` actualizado |
| Error inesperado de BD/servidor | `500` `{ "error": "Internal Server Error" }` |

### Coherencia HTTP

- Comparar con el estilo de `GET /candidates/:id`: formato `{ "error": "..." }`, códigos `400`/`404`/`500`.
- No unificar ni modificar endpoints existentes (`POST /candidates`, `GET /candidates/:id`, `POST /upload`).

## Restricciones

- **No hagas refactors grandes** ni reestructures capas.
- **No añadas dependencias nuevas** (ni librerías de test externas si no existen en el proyecto).
- Cambios permitidos: correcciones puntuales en los archivos de la implementación.
- No modifiques `schema.prisma` ni generes migraciones.
- Si todo cumple, no toques código innecesariamente.

## Proceso de revisión

1. Contrasta implementación vs `endpoints-spec.md` (contrato, validaciones, errores).
2. Recorre cada caso límite de las tablas anteriores (análisis estático del código; prueba manual con `curl` si el entorno está disponible).
3. Documenta hallazgos con severidad: **OK**, **BUG** o **MEJORA menor** (no implementar mejoras menores salvo que sean bugs de contrato).
4. Corrige solo los **BUG** con diff mínimo.
5. Verifica compilación: `npm run build` en `backend/`.

## Formato de salida

```
# Revisión: endpoints de reclutamiento

## Resumen
[PASS / PASS con correcciones / FAIL]

## Criterios de aceptación
| Criterio | Estado | Notas |

## Casos límite
| Caso | Estado | Código HTTP | Notas |

## Hallazgos y correcciones
| Severidad | Endpoint | Descripción | Acción tomada |

## Archivos modificados (si los hay)

## Cómo verificar
[comandos curl o pasos de prueba]
```

Guarda el resultado en `backend/docs/endpoints-review.md`.

## Criterio de calidad

La revisión es correcta si cada criterio de aceptación y caso límite queda evaluado explícitamente, los bugs detectados se corrigen con cambios mínimos, y el informe permite verificar el estado final sin explorar el código.

## Comentarios:

Gracias a este prompt el sistema detectó una serie de bugs en la implementación y los solucionó.

---

# Prompt 5: Generación de tests

## Prompt original:
Reescribe el siguiente prompt usando buenas prácticas de ingeniería de prompts:
Revisa cómo se escriben los tests en este backend y añade tests para estos endpoints:

GET /positions/:id/candidates
PUT /candidates/:id/stage

Casos mínimos:

- GET devuelve candidatos de una posición
- GET calcula correctamente average_score
- GET devuelve lista vacía o error si no hay candidatos, según el patrón del proyecto
- PUT actualiza current_interview_step
- PUT falla si el candidate no existe

Usa el mismo framework y estilo de tests existente.
No añadas dependencias nuevas.

## Meta prompt:

Eres un desarrollador backend senior especializado en testing con Jest y TypeScript. Tu tarea es **añadir tests** para dos endpoints del dominio de reclutamiento, reutilizando el framework ya configurado en el proyecto y **sin añadir dependencias nuevas**.

## Contexto obligatorio

Antes de escribir tests, revisa:

- `backend/jest.config.js` — preset `ts-jest`, entorno `node`
- `backend/package.json` — script `npm test` con Jest 29 y `ts-jest` (ya instalados)
- `backend/docs/endpoints-spec.md` — contrato y comportamiento esperado
- `backend/docs/endpoints-review.md` — casos límite verificados
- Implementación en `positionService.ts`, `candidateService.ts` y sus controladores

**Nota:** actualmente **no existen archivos de test** en `backend/src/` ni `backend/tests/`. Debes **establecer el patrón inicial** de tests del proyecto, alineado con Jest + mocks (sin `supertest`, que no está en dependencias).

## Objetivo

Crear tests que cubran los casos mínimos indicados, verificables con `npm test` en `backend/`.

## Casos mínimos a implementar

| # | Endpoint | Caso | Comportamiento esperado |
|---|---|---|---|
| 1 | `GET /positions/:id/candidates` | Posición con candidaturas | Devuelve lista con `candidateId`, `fullName`, `currentInterviewStep`, `averageScore` |
| 2 | `GET /positions/:id/candidates` | Cálculo de `averageScore` | Media de scores no nulos, redondeada a 1 decimal (ej. 5 y 4 → `4.5`) |
| 3 | `GET /positions/:id/candidates` | Posición sin candidaturas | `200` con `"candidates": []` (según spec, no error) |
| 4 | `PUT /candidates/:id/stage` | Actualización válida | Actualiza `currentInterviewStep` y devuelve respuesta con paso nuevo |
| 5 | `PUT /candidates/:id/stage` | Candidato inexistente | Error `404` `{ "error": "Candidate not found" }` |

## Estrategia de testing (sin dependencias nuevas)

- **Capa a testear:** servicios (`positionService`, `candidateService`) como mínimo; controladores opcionalmente con `req`/`res` mockeados.
- **Mocks:** usar `jest.mock()` sobre modelos de dominio (`Position`, `Candidate`, `Application`, `InterviewStep`) — mismo enfoque que usaría el proyecto sin BD de test.
- **No usar** `supertest`, base de datos real ni Docker en los tests.
- **No modificar** la lógica de producción salvo exportaciones mínimas necesarias para testear (p. ej. exportar `app` si ya no lo está).

## Restricciones

- **No añadas dependencias nuevas** (`supertest`, `jest-mock-extended`, etc.).
- **No hagas refactors grandes** en código de producción.
- No modifiques `schema.prisma` ni endpoints existentes.
- Mantén tests concisos, legibles y con nombres descriptivos en español o inglés (elige uno y sé consistente).
- Si necesitas configurar Jest (p. ej. `testMatch`, `roots`), hazlo solo en `jest.config.js` con cambios mínimos.

## Archivos esperados

| Acción | Archivo sugerido |
|---|---|
| Crear | `backend/src/application/services/positionService.test.ts` |
| Crear | `backend/src/application/services/candidateService.test.ts` |
| Modificar (si necesario) | `backend/jest.config.js` — solo para incluir archivos `*.test.ts` |

## Verificación

1. Ejecutar `npm test` en `backend/` — todos los tests deben pasar.
2. Confirmar que los 5 casos mínimos están cubiertos.
3. No deben requerirse variables de entorno ni conexión a PostgreSQL.

## Formato de respuesta

Al terminar, resume:

```
## Tests añadidos
### Archivos creados
### Casos cubiertos
### Comando de ejecución
### Resultado de npm test
```

## Criterio de calidad

Los tests son correctos si cubren los 5 casos mínimos, pasan con `npm test`, usan solo Jest/ts-jest ya presentes, y no dependen de infraestructura externa.
