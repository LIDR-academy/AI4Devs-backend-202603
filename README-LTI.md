# LTI — Applicant Tracking System (ATS)

> Sistema de Seguimiento de Talento desarrollado como aplicación full-stack con arquitectura en capas.

---

## Tabla de Contenidos

1. [Propósito de Negocio](#1-propósito-de-negocio)
2. [Tecnologías Usadas](#2-tecnologías-usadas)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
   - [Backend](#backend)
   - [Frontend](#frontend)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Estructura de Carpetas](#5-estructura-de-carpetas)
6. [Endpoints de la API](#6-endpoints-de-la-api)
7. [Configuración del Entorno](#7-configuración-del-entorno)
8. [Levantar el Entorno Completo](#8-levantar-el-entorno-completo)
9. [Verificación del Sistema](#9-verificación-del-sistema)

---

## 1. Propósito de Negocio

**LTI (Learning & Talent Intelligence)** es un sistema ATS (*Applicant Tracking System*) diseñado para optimizar y digitalizar el proceso de reclutamiento y selección de personal en organizaciones de cualquier tamaño.

### Problema que resuelve

Los procesos de selección tradicionales son manuales, lentos y propensos a errores: CVs en hojas de cálculo, correos masivos sin trazabilidad y falta de visibilidad del estado de cada candidato. LTI centraliza y automatiza este flujo.

### Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Gestión de candidatos** | Registro completo con datos personales, educación, experiencia laboral y CV adjunto |
| **Gestión de posiciones** | Creación y publicación de vacantes con descripción, requisitos, salario y tipo de empleo |
| **Flujos de entrevista** | Definición de etapas personalizadas por posición (técnica, cultural, final, etc.) |
| **Seguimiento de postulaciones** | Control del estado de cada candidato en cada etapa del proceso |
| **Registro de entrevistas** | Documentación de resultados, puntajes y notas por entrevistador |
| **Panel de reclutador** | Vista consolidada para gestionar el pipeline de candidatos |

### Actores del sistema

- **Reclutador**: Crea posiciones, revisa candidatos y coordina entrevistas.
- **Entrevistador (Employee)**: Registra resultados de entrevistas.
- **Candidato**: Se postula a posiciones y carga su CV.

---

## 2. Tecnologías Usadas

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| **Node.js** | ≥ 18.x | Runtime de JavaScript del servidor |
| **TypeScript** | ^4.9.5 | Tipado estático |
| **Express** | ^4.19.2 | Framework HTTP / REST API |
| **Prisma ORM** | ^5.13.0 | Acceso a base de datos y migraciones |
| **PostgreSQL** | latest (Docker) | Base de datos relacional |
| **Multer** | ^1.4.5 | Carga de archivos (CVs en PDF) |
| **Swagger UI** | ^5.0.0 | Documentación interactiva de la API |
| **dotenv** | ^16.4.5 | Gestión de variables de entorno |
| **CORS** | ^2.8.5 | Política de acceso cross-origin |
| **Jest** | ^29.7.0 | Framework de testing unitario |
| **ts-node-dev** | ^1.1.6 | Hot reload en desarrollo |

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | ^18.3.1 | Librería de UI |
| **TypeScript** | ^4.9.5 | Tipado estático |
| **React Bootstrap** | ^2.10.2 | Componentes UI con Bootstrap 5 |
| **React Router DOM** | ^6.23.1 | Enrutamiento SPA |
| **React Datepicker** | ^6.9.0 | Selector de fechas |
| **Bootstrap** | ^5.3.3 | Framework CSS |
| **Create React App** | 5.0.1 | Toolchain de React |

### Infraestructura

| Tecnología | Rol |
|---|---|
| **Docker** | Contenedorización de la base de datos PostgreSQL |
| **Docker Compose** | Orquestación de servicios |

---

## 3. Arquitectura del Sistema

### Backend

El backend sigue una **arquitectura en capas** inspirada en principios de Domain-Driven Design (DDD), con separación clara de responsabilidades:

```
HTTP Request
     │
     ▼
┌─────────────────────────┐
│  Presentation Layer     │  Controllers, manejo de req/res HTTP
│  (presentation/)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Routes Layer           │  Definición de rutas Express
│  (routes/)              │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Application Layer      │  Servicios, validaciones, lógica de app
│  (application/)         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Domain Layer           │  Modelos de negocio (entidades puras)
│  (domain/models/)       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Infrastructure Layer   │  Prisma Client → PostgreSQL
│  (infrastructure/)      │
└─────────────────────────┘
```

| Capa | Responsabilidad |
|---|---|
| `presentation/` | Controladores HTTP: reciben la request, llaman al servicio, devuelven la respuesta |
| `routes/` | Mapeo de verbos HTTP + paths a controladores |
| `application/` | Servicios de caso de uso, validaciones de negocio, carga de archivos |
| `domain/models/` | Clases de dominio: `Candidate`, `Position`, `Application`, `Interview`, etc. |
| `infrastructure/` | Adaptadores a tecnologías externas (Prisma, sistema de archivos) |

### Frontend

Aplicación **React SPA** con estructura de componentes:

```
src/
 ├── App.tsx                    ← Punto de entrada y router principal
 ├── components/
 │   ├── RecruiterDashboard.js  ← Panel principal del reclutador
 │   ├── AddCandidateForm.js    ← Formulario de alta de candidato
 │   └── FileUploader.js        ← Componente de carga de CV
 └── services/
     └── candidateService.js   ← Capa de comunicación con la API REST
```

El frontend se comunica con el backend exclusivamente a través de la API REST en `http://localhost:3010`.

---

## 4. Modelo de Datos

Esquema relacional gestionado con **Prisma ORM** sobre **PostgreSQL**.

### Diagrama Entidad-Relación

```mermaid
erDiagram
    Candidate {
        Int     id          PK
        String  firstName
        String  lastName
        String  email       "UNIQUE"
        String  phone       "nullable"
        String  address     "nullable"
    }

    Education {
        Int      id           PK
        String   institution
        String   title
        DateTime startDate
        DateTime endDate      "nullable"
        Int      candidateId  FK
    }

    WorkExperience {
        Int      id           PK
        String   company
        String   position
        String   description  "nullable"
        DateTime startDate
        DateTime endDate      "nullable"
        Int      candidateId  FK
    }

    Resume {
        Int      id           PK
        String   filePath
        String   fileType
        DateTime uploadDate
        Int      candidateId  FK
    }

    Company {
        Int    id   PK
        String name "UNIQUE"
    }

    Employee {
        Int     id        PK
        Int     companyId FK
        String  name
        String  email     "UNIQUE"
        String  role
        Boolean isActive
    }

    InterviewType {
        Int    id          PK
        String name
        String description "nullable"
    }

    InterviewFlow {
        Int    id          PK
        String description "nullable"
    }

    InterviewStep {
        Int    id              PK
        Int    interviewFlowId FK
        Int    interviewTypeId FK
        String name
        Int    orderIndex
    }

    Position {
        Int      id                  PK
        Int      companyId           FK
        Int      interviewFlowId     FK
        String   title
        String   description
        String   status
        Boolean  isVisible
        String   location
        String   jobDescription
        String   requirements        "nullable"
        String   responsibilities    "nullable"
        Float    salaryMin           "nullable"
        Float    salaryMax           "nullable"
        String   employmentType      "nullable"
        String   benefits            "nullable"
        String   companyDescription  "nullable"
        DateTime applicationDeadline "nullable"
        String   contactInfo         "nullable"
    }

    Application {
        Int      id                   PK
        Int      positionId           FK
        Int      candidateId          FK
        DateTime applicationDate
        Int      currentInterviewStep FK
        String   notes                "nullable"
    }

    Interview {
        Int      id              PK
        Int      applicationId   FK
        Int      interviewStepId FK
        Int      employeeId      FK
        DateTime interviewDate
        String   result          "nullable"
        Int      score           "nullable"
        String   notes           "nullable"
    }

    Candidate      ||--o{ Education       : "tiene"
    Candidate      ||--o{ WorkExperience  : "tiene"
    Candidate      ||--o{ Resume          : "sube"
    Candidate      ||--o{ Application     : "realiza"

    Company        ||--o{ Employee        : "emplea"
    Company        ||--o{ Position        : "publica"

    InterviewFlow  ||--o{ InterviewStep   : "contiene"
    InterviewFlow  ||--o{ Position        : "aplica a"

    InterviewType  ||--o{ InterviewStep   : "clasifica"

    Position       ||--o{ Application     : "recibe"

    InterviewStep  ||--o{ Application     : "etapa actual de"
    InterviewStep  ||--o{ Interview       : "ejecutada en"

    Application    ||--o{ Interview       : "genera"

    Employee       ||--o{ Interview       : "conduce"
```

---

### Descripción de entidades y campos

#### `Candidate` — Candidato

Entidad central del sistema. Representa a la persona que se postula a una vacante.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `firstName` | `String` | VarChar(100) | Nombre |
| `lastName` | `String` | VarChar(100) | Apellido |
| `email` | `String` | VarChar(255), UNIQUE | Correo electrónico |
| `phone` | `String?` | VarChar(15), nullable | Teléfono de contacto |
| `address` | `String?` | VarChar(100), nullable | Dirección postal |

---

#### `Education` — Formación académica

Historial educativo de un candidato. Un candidato puede tener múltiples registros.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `institution` | `String` | VarChar(100) | Nombre de la institución |
| `title` | `String` | VarChar(250) | Título o certificación obtenida |
| `startDate` | `DateTime` | NOT NULL | Fecha de inicio |
| `endDate` | `DateTime?` | nullable | Fecha de fin (null = en curso) |
| `candidateId` | `Int` | FK → Candidate.id | Candidato propietario |

---

#### `WorkExperience` — Experiencia laboral

Historial profesional del candidato. Relación `N:1` con `Candidate`.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `company` | `String` | VarChar(100) | Nombre de la empresa |
| `position` | `String` | VarChar(100) | Cargo ocupado |
| `description` | `String?` | VarChar(200), nullable | Descripción del rol |
| `startDate` | `DateTime` | NOT NULL | Fecha de inicio |
| `endDate` | `DateTime?` | nullable | Fecha de fin (null = empleo actual) |
| `candidateId` | `Int` | FK → Candidate.id | Candidato propietario |

---

#### `Resume` — Currículum vitae

Almacena la referencia al archivo CV subido. Un candidato puede tener múltiples versiones.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `filePath` | `String` | VarChar(500) | Ruta al archivo en el servidor |
| `fileType` | `String` | VarChar(50) | MIME type (ej. `application/pdf`) |
| `uploadDate` | `DateTime` | NOT NULL | Fecha y hora de carga |
| `candidateId` | `Int` | FK → Candidate.id | Candidato propietario |

---

#### `Company` — Empresa

Organización que publica vacantes y gestiona entrevistadores.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `name` | `String` | UNIQUE | Nombre de la empresa |

---

#### `Employee` — Empleado / Entrevistador

Persona interna de la empresa que conduce entrevistas.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `companyId` | `Int` | FK → Company.id | Empresa a la que pertenece |
| `name` | `String` | NOT NULL | Nombre completo |
| `email` | `String` | UNIQUE | Correo corporativo |
| `role` | `String` | NOT NULL | Rol (ej. `Recruiter`, `Tech Lead`) |
| `isActive` | `Boolean` | default: `true` | Indica si el empleado está activo |

---

#### `InterviewType` — Tipo de entrevista

Catálogo de tipos de entrevista disponibles en el sistema.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `name` | `String` | NOT NULL | Nombre (ej. `Técnica`, `Cultural Fit`) |
| `description` | `String?` | nullable | Descripción del tipo |

---

#### `InterviewFlow` — Flujo de entrevistas

Define la secuencia de etapas que se aplica a una vacante concreta.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `description` | `String?` | nullable | Descripción del flujo |

---

#### `InterviewStep` — Etapa del flujo

Cada paso individual dentro de un `InterviewFlow`. Tiene un orden definido.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `interviewFlowId` | `Int` | FK → InterviewFlow.id | Flujo al que pertenece |
| `interviewTypeId` | `Int` | FK → InterviewType.id | Tipo de entrevista de esta etapa |
| `name` | `String` | NOT NULL | Nombre de la etapa (ej. `Entrevista HR`) |
| `orderIndex` | `Int` | NOT NULL | Orden dentro del flujo (1, 2, 3…) |

---

#### `Position` — Vacante / Puesto

Oferta de empleo publicada por una empresa, con todos sus detalles.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `companyId` | `Int` | FK → Company.id | Empresa que publica |
| `interviewFlowId` | `Int` | FK → InterviewFlow.id | Flujo de entrevistas asignado |
| `title` | `String` | NOT NULL | Título del puesto |
| `description` | `String` | NOT NULL | Descripción general |
| `status` | `String` | default: `"Draft"` | Estado: `Draft`, `Open`, `Closed` |
| `isVisible` | `Boolean` | default: `false` | Si es pública para candidatos |
| `location` | `String` | NOT NULL | Ubicación del puesto |
| `jobDescription` | `String` | NOT NULL | Descripción detallada del trabajo |
| `requirements` | `String?` | nullable | Requisitos técnicos o académicos |
| `responsibilities` | `String?` | nullable | Responsabilidades del rol |
| `salaryMin` | `Float?` | nullable | Salario mínimo |
| `salaryMax` | `Float?` | nullable | Salario máximo |
| `employmentType` | `String?` | nullable | Tipo: `Full-time`, `Part-time`, etc. |
| `benefits` | `String?` | nullable | Beneficios ofrecidos |
| `companyDescription` | `String?` | nullable | Descripción de la empresa |
| `applicationDeadline` | `DateTime?` | nullable | Fecha límite de postulación |
| `contactInfo` | `String?` | nullable | Contacto para consultas |

---

#### `Application` — Postulación

Registra la candidatura de una persona a una vacante y su etapa actual.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `positionId` | `Int` | FK → Position.id | Vacante a la que aplica |
| `candidateId` | `Int` | FK → Candidate.id | Candidato postulante |
| `applicationDate` | `DateTime` | NOT NULL | Fecha de la postulación |
| `currentInterviewStep` | `Int` | FK → InterviewStep.id | Etapa actual del proceso |
| `notes` | `String?` | nullable | Notas adicionales del reclutador |

---

#### `Interview` — Entrevista

Registro de una entrevista realizada dentro de una postulación.

| Campo | Tipo | Restricción | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincrement | Identificador único |
| `applicationId` | `Int` | FK → Application.id | Postulación asociada |
| `interviewStepId` | `Int` | FK → InterviewStep.id | Etapa del flujo en que se realizó |
| `employeeId` | `Int` | FK → Employee.id | Entrevistador |
| `interviewDate` | `DateTime` | NOT NULL | Fecha y hora de la entrevista |
| `result` | `String?` | nullable | Resultado: `Approved`, `Rejected`, etc. |
| `score` | `Int?` | nullable | Puntuación numérica (ej. 1–10) |
| `notes` | `String?` | nullable | Comentarios del entrevistador |

---

### Resumen de relaciones

| Relación | Tipo | Descripción |
|---|---|---|
| `Candidate` → `Education` | 1 : N | Un candidato tiene varias formaciones |
| `Candidate` → `WorkExperience` | 1 : N | Un candidato tiene varias experiencias laborales |
| `Candidate` → `Resume` | 1 : N | Un candidato puede subir varios CVs |
| `Candidate` → `Application` | 1 : N | Un candidato puede postularse a varias vacantes |
| `Company` → `Employee` | 1 : N | Una empresa tiene varios empleados |
| `Company` → `Position` | 1 : N | Una empresa publica varias vacantes |
| `InterviewFlow` → `InterviewStep` | 1 : N | Un flujo tiene varias etapas ordenadas |
| `InterviewFlow` → `Position` | 1 : N | Un flujo puede usarse en varias vacantes |
| `InterviewType` → `InterviewStep` | 1 : N | Un tipo de entrevista puede aplicarse en varias etapas |
| `Position` → `Application` | 1 : N | Una vacante recibe varias postulaciones |
| `InterviewStep` → `Application` | 1 : N | Una etapa puede ser la actual de varias postulaciones |
| `InterviewStep` → `Interview` | 1 : N | Una etapa puede tener varias entrevistas |
| `Application` → `Interview` | 1 : N | Una postulación genera varias entrevistas |
| `Employee` → `Interview` | 1 : N | Un empleado conduce varias entrevistas |

---

## 5. Estructura de Carpetas

```
AI4Devs-backend-202603/
│
├── .env                           ← Variables de entorno (DB, URLs)
├── docker-compose.yml             ← Orquestación Docker (PostgreSQL)
├── README.md                      ← Documentación original (EN/ES)
├── README-LTI.md                  ← Esta documentación
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── api-spec.yaml              ← Especificación OpenAPI/Swagger
│   │
│   ├── prisma/
│   │   ├── schema.prisma          ← Definición del esquema de BD
│   │   ├── seed.ts                ← Script de datos iniciales
│   │   └── migrations/            ← Historial de migraciones SQL
│   │
│   └── src/
│       ├── index.ts               ← Punto de entrada: Express + middlewares
│       │
│       ├── routes/
│       │   └── candidateRoutes.ts ← Rutas de candidatos
│       │
│       ├── presentation/
│       │   └── controllers/
│       │       └── candidateController.ts
│       │
│       ├── application/
│       │   ├── validator.ts       ← Validaciones de dominio
│       │   └── services/
│       │       ├── candidateService.ts
│       │       └── fileUploadService.ts
│       │
│       ├── domain/
│       │   └── models/
│       │       ├── Candidate.ts
│       │       ├── Education.ts
│       │       ├── WorkExperience.ts
│       │       ├── Resume.ts
│       │       ├── Application.ts
│       │       ├── Company.ts
│       │       ├── Employee.ts
│       │       ├── Position.ts
│       │       ├── InterviewFlow.ts
│       │       ├── InterviewStep.ts
│       │       ├── InterviewType.ts
│       │       └── Interview.ts
│       │
│       └── infrastructure/        ← Adaptadores a infraestructura
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    │
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    │
    └── src/
        ├── index.tsx              ← Punto de entrada React
        ├── App.tsx                ← Componente raíz + rutas
        │
        ├── components/
        │   ├── RecruiterDashboard.js
        │   ├── AddCandidateForm.js
        │   └── FileUploader.js
        │
        ├── services/
        │   └── candidateService.js
        │
        └── assets/
            └── lti-logo.png
```

---

## 6. Endpoints de la API

Base URL: `http://localhost:3010`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Health check del servidor |
| `POST` | `/candidates` | Registrar nuevo candidato |
| `GET` | `/candidates/:id` | Obtener candidato por ID |
| `PUT` | `/candidates/:id/stage` | Actualizar etapa de una postulación (Kanban) |
| `GET` | `/positions/:id/candidates` | Obtener candidatos por posición con etapa y puntuación media |
| `POST` | `/upload` | Subir archivo CV (multipart/form-data) |

### Ejemplo: Obtener candidatos de una posición (Kanban)

```bash
GET http://localhost:3010/positions/1/candidates
```

**Respuesta:**
```json
[
  {
    "applicationId": 1,
    "candidateId": 1,
    "fullName": "John Doe",
    "currentInterviewStep": { "id": 2, "name": "Technical Interview", "orderIndex": 2 },
    "averageScore": 5
  }
]
```

### Ejemplo: Mover candidato a otra etapa (Kanban)

```bash
PUT http://localhost:3010/candidates/1/stage
Content-Type: application/json

{ "newInterviewStepId": 3 }
```

> **Nota:** `:id` en `PUT /candidates/:id/stage` corresponde al `Application.id`, no al `Candidate.id`.

### Ejemplo: Crear candidato

```http
POST http://localhost:3010/candidates
Content-Type: application/json

{
    "firstName": "Ana",
    "lastName": "García",
    "email": "ana.garcia@ejemplo.com",
    "phone": "+54 260 403 2552",
    "address": "Calle Mayor 10, Madrid",
    "educations": [
        {
            "institution": "Universidad Complutense",
            "title": "Ingeniería Informática",
            "startDate": "2015-09-01",
            "endDate": "2019-06-30"
        }
    ],
    "workExperiences": [
        {
            "company": "Tech Corp",
            "position": "Desarrolladora Backend",
            "description": "Desarrollo de microservicios en Node.js",
            "startDate": "2019-09-01",
            "endDate": "2023-12-31"
        }
    ],
    "cv": {
        "filePath": "uploads/cv-ana-garcia.pdf",
        "fileType": "application/pdf"
    }
}
```

---

## 7. Configuración del Entorno

### Prerrequisitos

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) >= 9.x
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Variables de entorno

Se requieren **dos archivos `.env`**:

**1. Raíz del proyecto** (`.env`) — usado por Docker Compose:

```env
DB_PASSWORD=D1ymf8wyQEGthFR1E9xhCq
DB_USER=LTIdbUser
DB_NAME=LTIdb
DB_PORT=5435
DATABASE_URL="postgresql://LTIdbUser:D1ymf8wyQEGthFR1E9xhCq@localhost:5435/LTIdb"
```

**2. Carpeta backend** (`backend/.env`) — usado por Prisma y la aplicación Node:

```env
DATABASE_URL="postgresql://LTIdbUser:D1ymf8wyQEGthFR1E9xhCq@localhost:5435/LTIdb"
```

> **Nota:** El puerto `5435` evita conflictos con otras instancias de PostgreSQL que puedan estar corriendo en el puerto estándar `5432`. No usar estas credenciales en producción.

---

## 8. Levantar el Entorno Completo

Seguir los pasos **en orden**:

### Paso 1 — Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd AI4Devs-backend-202603
```

### Paso 2 — Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Verificar que el contenedor está corriendo:

```bash
docker ps
```

Deberías ver un contenedor `postgres` activo en el puerto `5435`.

Credenciales de conexión:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `5435` |
| Usuario | `LTIdbUser` |
| Contraseña | `D1ymf8wyQEGthFR1E9xhCq` |
| Base de datos | `LTIdb` |

### Paso 3 — Instalar dependencias del backend

```bash
cd backend
npm install
```

### Paso 4 — Inicializar la base de datos con Prisma

```bash
# Dentro de la carpeta backend/

# Generar el cliente Prisma
npx prisma generate

# Aplicar migraciones (crea las tablas en PostgreSQL)
npx prisma migrate dev --name init

# Poblar la base de datos con datos de ejemplo
# Usar ts-node-dev con --transpile-only por compatibilidad con TypeScript 4.9.5
node_modules/.bin/ts-node-dev --transpile-only prisma/seed.ts
```

### Paso 5 — Iniciar el backend en modo desarrollo

```bash
# Dentro de la carpeta backend/
npm run dev
```

El servidor estará disponible en: **http://localhost:3010**

Para producción, compilar y ejecutar:

```bash
npm run build
npm start
```

### Paso 6 — Instalar dependencias del frontend

Abrir una **nueva terminal**:

```bash
cd frontend
npm install
```

### Paso 7 — Iniciar el frontend

```bash
# Dentro de la carpeta frontend/
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 9. Verificación del Sistema

Una vez levantado todo el entorno, verificar que cada componente responde correctamente:

### Backend — Health check

```bash
curl http://localhost:3010/
# Respuesta esperada: Hola LTI!
```

### Backend — Crear candidato de prueba

```bash
curl -X POST http://localhost:3010/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Usuario",
    "email": "test@lti.com",
    "phone": "600000001",
    "address": "Calle Test 1"
  }'
```

### Backend — Obtener candidato

```bash
curl http://localhost:3010/candidates/1
```

### Endpoints Kanban

```bash
# Candidatos de la posición 1
curl http://localhost:3010/positions/1/candidates

# Mover postulación 1 a la etapa 3
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d '{ "newInterviewStepId": 3 }'
```

### Frontend

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

El dashboard muestra dos acciones:
- **Ver Candidatos** → vista Kanban agrupada por etapa de entrevista (`/candidates`)
- **Añadir Nuevo Candidato** → formulario de alta de candidato (`/add-candidate`)

### Detener todos los servicios

```bash
# Detener el contenedor de PostgreSQL
docker-compose down

# Para eliminar también los volúmenes (borra los datos)
docker-compose down -v
```

---

## Resumen de URLs

| Servicio | URL |
|---|---|
| Frontend React | http://localhost:3000 |
| Backend API | http://localhost:3010 |
| PostgreSQL | localhost:5435 |

---

*Documentación generada para el proyecto LTI — AI4Devs Backend 202603*
