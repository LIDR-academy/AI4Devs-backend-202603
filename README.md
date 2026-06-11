# LTI - Talent Tracking System | EN

LTI (Lean Talent Intelligence) is a full-stack ATS (Applicant Tracking System) with a React frontend and an Express + TypeScript backend using Prisma ORM and PostgreSQL.

The backend follows **Hexagonal Architecture (Ports & Adapters)** with DDD tactical patterns. Domain models are pure data classes with no infrastructure dependencies.

## Backend Architecture

```
src/
├── application/
│   ├── services/           # Business logic — orchestrates queries, no req/res
│   └── validator.ts        # Input validation (delegates to Value Objects)
├── domain/
│   ├── models/             # Pure entities: properties + constructor only
│   ├── repositories/       # Interfaces (Ports): ICandidateRepository, etc.
│   └── valueObjects/       # Email, PhoneNumber, PersonName — self-validating
├── infrastructure/
│   ├── database/           # Singleton PrismaClient (shared across the app)
│   └── repositories/       # Adapters: PrismaCandidateRepository, etc.
├── presentation/
│   └── controllers/        # HTTP layer: parse request, map errors to status codes
├── routes/                 # Express route definitions
└── index.ts                # Entry point: Express setup and middleware
```

## Project Structure

```
AI4Devs-backend-202603/
├── backend/
│   ├── prisma/schema.prisma     # Data model (12 entities)
│   ├── src/                     # Source code (see architecture above)
│   ├── api-spec.yaml            # OpenAPI 3.0 specification
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/                  # Static assets
│   └── src/
│       ├── components/          # AddCandidateForm, FileUploader, RecruiterDashboard
│       ├── services/            # HTTP clients for the API
│       └── App.tsx
├── docker-compose.yml           # PostgreSQL container
└── .env                         # Environment variables (do not commit)
```

## First steps

1. Clone the repository.
2. Install dependencies:

```sh
cd frontend && npm install
cd ../backend && npm install
```

3. Start the database:

```sh
docker-compose up -d
```

4. Set up Prisma:

```sh
cd backend
npx prisma generate
npx prisma migrate dev
ts-node prisma/seed.ts
```

5. Start the backend (dev mode with hot-reload):

```sh
npm run dev
# http://localhost:3010
```

6. Start the frontend:

```sh
cd ../frontend && npm start
# http://localhost:3000
```

## Docker and PostgreSQL

This project uses Docker Compose to run PostgreSQL. Connection details (replace with your `.env` values):

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `password`
- Database: `mydatabase`

```sh
docker-compose up -d    # start
docker-compose down     # stop
```

## Available API Endpoints

| Method | Route                          | Description                                      |
|--------|--------------------------------|--------------------------------------------------|
| GET    | `/`                            | Healthcheck                                      |
| POST   | `/candidates`                  | Create a new candidate                           |
| GET    | `/candidates/:id`              | Get a candidate by ID                            |
| GET    | `/positions/:id/candidates`    | Get all candidates in process for a position     |
| POST   | `/candidates/:id/stage`        | Update the interview stage of an application     |
| POST   | `/upload`                      | Upload a CV file (PDF or DOCX only)              |

```json
POST http://localhost:3010/candidates
{
    "firstName": "Albert",
    "lastName": "Saelices",
    "email": "albert.saelices@gmail.com",
    "phone": "656874937",
    "address": "Calle Sant Dalmir 2, 5ºB. Barcelona",
    "educations": [
        {
            "institution": "UC3M",
            "title": "Computer Science",
            "startDate": "2006-12-31",
            "endDate": "2010-12-26"
        }
    ],
    "workExperiences": [
        {
            "company": "Coca Cola",
            "position": "SWE",
            "description": "",
            "startDate": "2011-01-13",
            "endDate": "2013-01-17"
        }
    ],
    "cv": {
        "filePath": "uploads/1715760936750-cv.pdf",
        "fileType": "application/pdf"
    }
}
```

## Running tests

```sh
cd backend && npm test
```

--------------------------------------------

# LTI - Sistema de Seguimiento de Talento | ES

LTI (Lean Talent Intelligence) es una aplicación full-stack ATS con frontend en React y backend en Express + TypeScript usando Prisma ORM y PostgreSQL.

El backend sigue **Arquitectura Hexagonal (Ports & Adapters)** con patrones DDD tácticos. Los modelos de dominio son clases puras sin dependencias de infraestructura.

## Arquitectura del Backend

```
src/
├── application/
│   ├── services/           # Lógica de negocio — orquesta queries, sin req/res
│   └── validator.ts        # Validación de entrada (delega a Value Objects)
├── domain/
│   ├── models/             # Entidades puras: propiedades + constructor
│   ├── repositories/       # Interfaces (Ports): ICandidateRepository, etc.
│   └── valueObjects/       # Email, PhoneNumber, PersonName — auto-validados
├── infrastructure/
│   ├── database/           # Singleton PrismaClient (compartido en toda la app)
│   └── repositories/       # Adapters: PrismaCandidateRepository, etc.
├── presentation/
│   └── controllers/        # Capa HTTP: parsea request, mapea errores a códigos
├── routes/                 # Definición de rutas Express
└── index.ts                # Punto de entrada: configuración Express y middleware
```

## Estructura del Proyecto

```
AI4Devs-backend-202603/
├── backend/
│   ├── prisma/schema.prisma     # Modelo de datos (12 entidades)
│   ├── src/                     # Código fuente (ver arquitectura arriba)
│   ├── api-spec.yaml            # Especificación OpenAPI 3.0
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/                  # Recursos estáticos
│   └── src/
│       ├── components/          # AddCandidateForm, FileUploader, RecruiterDashboard
│       ├── services/            # Clientes HTTP para la API
│       └── App.tsx
├── docker-compose.yml           # Contenedor PostgreSQL
└── .env                         # Variables de entorno (no subir a git)
```

## Primeros Pasos

1. Clona el repositorio.
2. Instala dependencias:

```sh
cd frontend && npm install
cd ../backend && npm install
```

3. Inicia la base de datos:

```sh
docker-compose up -d
```

4. Configura Prisma:

```sh
cd backend
npx prisma generate
npx prisma migrate dev
ts-node prisma/seed.ts
```

5. Inicia el backend (modo desarrollo con hot-reload):

```sh
npm run dev
# http://localhost:3010
```

6. Inicia el frontend:

```sh
cd ../frontend && npm start
# http://localhost:3000
```

## Docker y PostgreSQL

El proyecto usa Docker Compose para levantar PostgreSQL. Credenciales (reemplaza con los valores de tu `.env`):

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `password`
- Database: `mydatabase`

```sh
docker-compose up -d    # iniciar
docker-compose down     # detener
```

## Endpoints disponibles

| Método | Ruta                           | Descripción                                              |
|--------|--------------------------------|----------------------------------------------------------|
| GET    | `/`                            | Healthcheck                                              |
| POST   | `/candidates`                  | Crear un nuevo candidato                                 |
| GET    | `/candidates/:id`              | Obtener un candidato por ID                              |
| GET    | `/positions/:id/candidates`    | Candidatos en proceso para una posición (vista Kanban)   |
| POST   | `/candidates/:id/stage`        | Actualizar la fase de entrevista de una candidatura      |
| POST   | `/upload`                      | Subir un fichero de CV (solo PDF o DOCX)                 |

```json
POST http://localhost:3010/candidates
{
    "firstName": "Albert",
    "lastName": "Saelices",
    "email": "albert.saelices@gmail.com",
    "phone": "656874937",
    "address": "Calle Sant Dalmir 2, 5ºB. Barcelona",
    "educations": [
        {
            "institution": "UC3M",
            "title": "Computer Science",
            "startDate": "2006-12-31",
            "endDate": "2010-12-26"
        }
    ],
    "workExperiences": [
        {
            "company": "Coca Cola",
            "position": "SWE",
            "description": "",
            "startDate": "2011-01-13",
            "endDate": "2013-01-17"
        }
    ],
    "cv": {
        "filePath": "uploads/1715760936750-cv.pdf",
        "fileType": "application/pdf"
    }
}
```

## Ejecutar tests

```sh
cd backend && npm test
```
