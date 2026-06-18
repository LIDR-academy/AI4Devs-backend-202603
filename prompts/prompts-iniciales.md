# Prompts Iniciales — Sesión de Diseño LTI

Registro de los prompts utilizados durante la sesión de diseño y especificación del proyecto LTI ATS.

---

## Prompt 1 — Documentación general del proyecto (README)

**Rol asignado:** Experto arquitecto de sistemas con experiencia en ATS.

```
Eres un experto arquitecto de sistemas con experiencia en ATS. Genérame una documentación
para el README que incluya:
 - propósito de negocio de LTI
 - la estructura de carpetas
 - las tecnologías usadas
 - la arquitectura de backend y frontend
 - todos los pasos para levantar el entorno, incluida la base de datos.
 Hazlo en español y en formato markdown.
 Realizalo en otro README distinto al README.md
```

**Artefacto generado:** `README-LTI.md`

---

## Prompt 2 — Documentación del modelo de datos

**Rol asignado:** Experto en bases de datos.

```
Eres un experto en bases de datos. Dame una documentación del modelo de datos que explique
campos, relaciones y un diagrama en formato mermaid @prisma
Este prompt nos servirá como contexto para nuestro proyecto.
```

**Artefacto generado:** Sección "4. Modelo de Datos" dentro de `README-LTI.md`, con diagrama Mermaid ER completo y tablas de campos por entidad.

---

## Prompt 3 — Especificación técnica de endpoints Kanban

**Rol asignado:** Experto en producto.

```
Tu misión en este ejercicio es crear dos nuevos endpoints que nos permitirán manipular
la lista de candidatos de una aplicación en una interfaz tipo kanban.

GET /positions/:id/candidates
Este endpoint recogerá todos los candidatos en proceso para una determinada posición,
es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar
la siguiente información básica:
- Nombre completo del candidato (de la tabla candidate).
- current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
- La puntuación media del candidato. Recuerda que cada entrevista (interview) realizada
  por el candidato tiene un score.

PUT /candidates/:id/stage
Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual
del proceso de entrevista en la que se encuentra un candidato específico.

Eres un experto en producto.
A este pedido le falta detalle técnico y específico para permitir al developer ser totalmente
autónomo a la hora de completarla.
Por favor entiende la necesidad y proporciona una especificacion mejorada que sea más clara,
específica y concisa acorde a las mejores prácticas de producto, incluyendo descripción completa
de la funcionalidad, lista exhaustiva de campos a tocar, estructura y URL de los endpoints
necesarios, ficheros a modificar acorde a la arquitectura y buenas prácticas, pasos para que
la tarea se asuma como completada, cómo actualizar la documentación que sea relevante o crear
tests unitarios, y requisitos no funcionales relativos a seguridad, rendimiento, etc.
Devuélvela en formato markdown.

Elabora un plan para ejecutar paso a paso
```

**Artefacto generado:** `SPEC-kanban-candidates.md`

---

## Prompt 4 — Implementación de los endpoints Kanban

**Acción:** Ejecución del plan de desarrollo paso a paso.

```
ok arranquemos
```

**Artefactos generados / modificados:**

| Archivo | Acción |
|---|---|
| `backend/src/domain/models/Application.ts` | Añadidos `findByPositionId()`, `updateStage()`, `findWithPosition()` |
| `backend/src/application/services/positionService.ts` | CREADO — lógica de negocio GET candidatos |
| `backend/src/presentation/controllers/positionController.ts` | CREADO — controlador HTTP |
| `backend/src/routes/positionRoutes.ts` | CREADO — `GET /:id/candidates` |
| `backend/src/application/services/candidateService.ts` | Añadido `updateApplicationStage()` |
| `backend/src/presentation/controllers/candidateController.ts` | Añadido `updateCandidateStage()` |
| `backend/src/routes/candidateRoutes.ts` | Añadido `PUT /:id/stage` |
| `backend/src/index.ts` | Montaje de `positionRoutes` |
| `backend/src/tests/positionService.test.ts` | CREADO — 6 tests unitarios |
| `backend/src/tests/candidateService.test.ts` | CREADO — 5 tests unitarios |

**Resultado de tests:** 11/11 pasando (`npm test`).

---

## Prompt 5 — Corrección del validador de teléfono

**Contexto:** Error al ingresar número de teléfono argentino `2604032552` en el formulario.

```
Ya levanto todo, me sale un error al cargar el numero en el formulario
este es el numero de telefono: 2604032552
```

**Causa:** La regex `PHONE_REGEX` solo aceptaba números españoles (`/^(6|7|9)\d{8}$/`).

**Corrección aplicada en** `backend/src/application/validator.ts`:
```
/^\+?[\d\s\-().]{7,15}$/
```
Acepta números internacionales con prefijo `+`, espacios, guiones y paréntesis, respetando el límite `VarChar(15)` de la BD.

---

## Prompt 6 — Vista de listado de candidatos en el frontend

**Contexto:** El frontend no tenía pantalla para ver candidatos.

```
Lo que no veo en la pantalla para listar los candidatos
```

**Artefactos generados / modificados:**

| Archivo | Acción |
|---|---|
| `frontend/src/components/CandidateList.js` | CREADO — vista Kanban por etapa de entrevista |
| `frontend/src/App.js` | Añadida ruta `/candidates` |
| `frontend/src/components/RecruiterDashboard.js` | Añadido botón "Ver Candidatos" |

**Funcionalidad:** Vista Kanban agrupada por etapa, con selector de posición, nombre del candidato y badge de puntuación media con colores semánticos (verde ≥7, amarillo ≥5, rojo <5).

---

## Prompt 7 — Resolución de entorno (Docker / PostgreSQL / puertos)

**Contexto:** Problemas de configuración del entorno al levantar el proyecto por primera vez.

**Resoluciones aplicadas:**

| Problema | Solución |
|---|---|
| Puerto 5432 ocupado por otro contenedor | Nuevo contenedor en puerto `5435` |
| Schema Prisma con URL hardcodeada | Cambiado a `env("DATABASE_URL")` |
| `backend/.env` ausente | Creado `backend/.env` con `DATABASE_URL` apuntando a `localhost:5435` |
| BD con esquema diferente en contenedor existente | Nuevo contenedor + `prisma migrate dev` + seed |
| `ts-node` incompatible con TypeScript 4.9.5 | Seed ejecutado con `ts-node-dev --transpile-only` |

---

## Contexto y decisiones de diseño relevantes

Durante la sesión se tomaron las siguientes decisiones de diseño que deben preservarse como contexto:

### Arquitectura backend

El backend sigue una **arquitectura en capas** con la siguiente convención:

```
routes/ → presentation/controllers/ → application/services/ → domain/models/ → Prisma
```

- Ningún controlador contiene lógica de negocio.
- Ningún servicio importa `PrismaClient` directamente; accede a la BD a través de los modelos.
- Los cambios de rutas, controladores y servicios se ubican **dentro de la carpeta `/backend`**.

### Decisión sobre `PUT /candidates/:id/stage`

El parámetro `:id` de la URL corresponde al **`Application.id`** (no al `Candidate.id`), porque un candidato puede estar postulado a múltiples posiciones simultáneamente y es necesario identificar con precisión cuál aplicación actualizar.

### Cálculo de `averageScore`

Se calcula **en memoria** (JavaScript) sobre los datos traídos mediante `include` en una única query Prisma, evitando el problema de N+1 queries. Se redondea a 2 decimales. Devuelve `null` si ninguna entrevista tiene score registrado.
