# Mapa de contexto del backend

Análisis del backend para implementar dos endpoints relacionados con **candidates**, **positions**, **applications** e **interviews**. Sin código de implementación.

---

## 1. Estructura del backend

El backend vive en `backend/src/` con arquitectura en capas (aunque sin carpeta `infrastructure/` ni `tests/`, que el README menciona pero no existen).

| Carpeta | Responsabilidad |
|---|---|
| `routes/` | Define rutas Express y monta handlers |
| `presentation/controllers/` | Maneja HTTP: parseo de params, códigos de estado, respuestas JSON |
| `application/services/` | Orquesta lógica de negocio y validación |
| `application/validator.ts` | Reglas de validación alineadas con `api-spec.yaml` |
| `domain/models/` | Clases de dominio con persistencia embebida (`save()`, `findOne()`) |

**Flujo típico de una petición:**

```
index.ts → routes/*.ts → controller (opcional) → service → domain model → Prisma
```

El punto de entrada es `backend/src/index.ts`: crea la app Express, instancia `PrismaClient`, inyecta `req.prisma` por middleware, monta rutas y escucha en el puerto `3010`.

---

## 2. Ubicación de componentes clave

### Rutas

- Único archivo de rutas de dominio: `backend/src/routes/candidateRoutes.ts`
- Montaje en `index.ts`: `app.use('/candidates', candidateRoutes)`
- Upload montado directamente: `app.post('/upload', uploadFile)` en `index.ts`

**No existen** rutas para `positions`, `applications` ni `interviews`.

### Controladores

- `backend/src/presentation/controllers/candidateController.ts`
- Contiene `getCandidateById` y `addCandidateController` (este último no se usa en las rutas actuales).

### Servicios

- `backend/src/application/services/candidateService.ts` — alta y búsqueda de candidatos
- `backend/src/application/services/fileUploadService.ts` — subida de ficheros con multer

**No hay capa de repositorio separada.** La persistencia está en las clases de `domain/models/`.

### Modelos de dominio

Todos en `backend/src/domain/models/`:

| Modelo | Archivo | ¿Conectado a rutas? |
|---|---|---|
| Candidate | `Candidate.ts` | Sí |
| Education, WorkExperience, Resume | respectivos `.ts` | Sí (vía alta de candidato) |
| Position | `Position.ts` | No |
| Application | `Application.ts` | No |
| Interview | `Interview.ts` | No |
| Company, Employee, InterviewFlow, InterviewStep, InterviewType | respectivos `.ts` | No |

Cada modelo instancia su propio `PrismaClient` internamente (patrón activo, distinto del `req.prisma` del middleware).

---

## 3. Persistencia

- **ORM:** Prisma 5 (`@prisma/client`)
- **BD:** PostgreSQL
- **Schema:** `backend/prisma/schema.prisma` — 12 modelos migrados
- **Seed de datos:** `backend/prisma/seed.ts` — datos de ejemplo para todo el dominio de reclutamiento
- **Contrato API:** `backend/api-spec.yaml` — solo documenta `POST /candidates` y `POST /upload`

**Instanciación del cliente:**

- Global en `index.ts` → inyectado como `req.prisma` (hoy poco usado)
- Local en cada clase de `domain/models/` → patrón real de persistencia actual

---

## 4. Modelos y tablas relevantes

### Candidate

- Tabla: `Candidate`
- Campos: `id`, `firstName`, `lastName`, `email` (unique), `phone`, `address`
- Relaciones: 1→N con `Education`, `WorkExperience`, `Resume`, `Application`

### Position

- Tabla: `Position`
- Campos clave: `id`, `companyId`, `interviewFlowId`, `title`, `description`, `status`, `isVisible`, `location`, `jobDescription`, `salaryMin/Max`, `applicationDeadline`, etc.
- Relaciones:
  - N→1 `Company` (via `companyId`)
  - N→1 `InterviewFlow` (via `interviewFlowId`)
  - 1→N `Application`

### Application

- Tabla: `Application`
- Campos: `id`, `positionId`, `candidateId`, `applicationDate`, `currentInterviewStep`, `notes`
- Relaciones:
  - N→1 `Position` (via `positionId`)
  - N→1 `Candidate` (via `candidateId`)
  - N→1 `InterviewStep` (via `currentInterviewStep`) — paso actual del proceso
  - 1→N `Interview`

### Interview

- Tabla: `Interview`
- Campos: `id`, `applicationId`, `interviewStepId`, `employeeId`, `interviewDate`, `result`, `score`, `notes`
- Relaciones:
  - N→1 `Application` (via `applicationId`)
  - N→1 `InterviewStep` (via `interviewStepId`)
  - N→1 `Employee` (via `employeeId`)

### Entidades de soporte (necesarias para entender relaciones)

```
Company 1──N Position N──1 InterviewFlow 1──N InterviewStep
                                              ↑              ↑
Candidate 1──N Application ──────────────────┘              │
         N──1 Position                                      │
         currentInterviewStep ──────────────────────────────┘
Application 1──N Interview N──1 InterviewStep
Interview N──1 Employee N──1 Company
```

**Cadena de negocio:** un `Candidate` se postula a una `Position` creando una `Application`, que avanza por `InterviewStep`s del flujo de la posición; cada paso completado genera un `Interview` evaluado por un `Employee`.

---

## 5. Endpoints de referencia

| Método | Ruta | Capas | Comportamiento |
|---|---|---|---|
| `POST` | `/candidates` | `candidateRoutes` → `candidateService.addCandidate` → `Candidate` + hijos | Valida, crea candidato con educación, experiencia y CV opcional. Devuelve `201`. Maneja `P2002` (email duplicado) → `400`. |
| `GET` | `/candidates/:id` | `candidateRoutes` → `candidateController.getCandidateById` → `candidateService.findCandidateById` → `Candidate.findOne` | Devuelve candidato con `educations`, `workExperiences`, `resumes` y `applications` (incluye `position.title` e `interviews` con `interviewStep.name`). `404` si no existe. **No está en `api-spec.yaml`.** |
| `POST` | `/upload` | `index.ts` → `fileUploadService.uploadFile` | Sube PDF/DOCX con multer. Devuelve `filePath` y `fileType`. |
| `GET` | `/` | `index.ts` | Health check: `"Hola LTI!"` |

### Convenciones a replicar para los dos nuevos endpoints

1. **Nuevo archivo de rutas** por recurso (`positionRoutes.ts`, `applicationRoutes.ts`, etc.) y montaje en `index.ts` con `app.use('/...', router)`.
2. **Controller** en `presentation/controllers/` para manejar HTTP (validar IDs con `parseInt`, códigos `400`/`404`/`500`).
3. **Service** en `application/services/` para orquestar validación y llamadas a modelos de dominio.
4. **Modelos de dominio** ya existen para `Position`, `Application` e `Interview` con `save()` y `findOne()` — reutilizarlos o extenderlos con métodos estáticos de consulta (p. ej. `findByPositionId`) siguiendo el patrón de `Candidate.findOne`.
5. **Validación** en `application/validator.ts` si hay reglas de entrada nuevas.
6. **Contrato OpenAPI** — ampliar `backend/api-spec.yaml` al añadir endpoints.
7. **Consultas con relaciones** — `Candidate.findOne` ya hace un `include` anidado de `applications → position, interviews → interviewStep`; es el patrón a imitar para endpoints que crucen entidades.

### Dónde encajarían los dos nuevos endpoints

| Pieza a crear | Ubicación sugerida |
|---|---|
| Rutas | `backend/src/routes/` (nuevo archivo por recurso) |
| Controladores | `backend/src/presentation/controllers/` |
| Servicios | `backend/src/application/services/` |
| Consultas complejas | Métodos estáticos nuevos en `domain/models/` o queries Prisma en servicios |
| Registro de rutas | `backend/src/index.ts` |
| Documentación | `backend/api-spec.yaml` |

### Estado actual

**Lo que ya existe:**

- Modelos de dominio y schema Prisma completos para las cuatro entidades
- Seed con datos de prueba (`backend/prisma/seed.ts`)
- `GET /candidates/:id` que ya cruza candidatos, aplicaciones, posiciones y entrevistas

**Lo que falta:**

- Rutas, controladores y servicios para `Position`, `Application` e `Interview` (salvo la lectura parcial vía candidato)
