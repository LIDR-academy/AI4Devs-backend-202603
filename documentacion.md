# Documentacion tecnica del proyecto

## 1. Descripcion general

El proyecto es una aplicacion full-stack para seguimiento de talento/reclutamiento. Esta organizado como monorepo con:

- `backend`: API REST en Node.js, Express y TypeScript.
- `frontend`: aplicacion React creada con Create React App.
- `prisma`: modelo de datos, migraciones y seed para PostgreSQL.
- `docker-compose.yml`: servicio PostgreSQL parametrizado con variables de entorno.

El dominio principal expuesto por la API actual es la gestion de candidatos: alta de candidato, carga de CV y consulta por ID. El modelo de datos, sin embargo, incluye un dominio mas amplio: empresas, empleados, posiciones, flujos de entrevista, pasos, aplicaciones e entrevistas.

## 2. Frameworks y tecnologias

Backend:

- Node.js + Express 4.
- TypeScript.
- Prisma ORM 5 con PostgreSQL.
- Multer para subida de archivos.
- CORS para permitir el frontend local.
- Jest configurado con `ts-jest`, aunque no hay carpeta de tests.
- Swagger/OpenAPI existe como `backend/api-spec.yaml`, pero no se monta en Express.

Frontend:

- React 18.
- Create React App / `react-scripts`.
- React Router DOM.
- React Bootstrap.
- React Datepicker.
- Hay un servicio que usa `axios`, pero `axios` no esta declarado en `frontend/package.json`.

Infraestructura:

- Docker Compose levanta PostgreSQL usando `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT` desde `.env`.
- Prisma no usa `DATABASE_URL` desde `.env`; usa una URL hardcodeada en `backend/prisma/schema.prisma`.

## 3. Arquitectura general detectada

La arquitectura pretendida se parece a una separacion por capas:

- `presentation/controllers`: controladores HTTP.
- `routes`: definicion de rutas Express.
- `application/services`: casos de uso y servicios de aplicacion.
- `application/validator.ts`: validacion manual de entrada.
- `domain/models`: clases de dominio.
- `prisma`: persistencia y schema.

La arquitectura real tiene acoplamientos importantes:

- No existe carpeta `infrastructure`, aunque el README la menciona.
- No existe capa de repositorios.
- Los modelos de dominio crean su propio `PrismaClient` y hacen persistencia directa.
- `backend/src/index.ts` tambien crea un `PrismaClient` y lo adjunta a `req.prisma`, pero ese cliente no es usado por rutas, servicios ni modelos.
- La ruta `POST /candidates` no usa `addCandidateController`; importa `addCandidate` reexportado desde el controlador, por lo que salta parte de la capa de presentacion.

Flujo actual de alta de candidato:

1. `POST /candidates` entra por `backend/src/routes/candidateRoutes.ts`.
2. La ruta llama a `addCandidate(req.body)`.
3. `candidateService.addCandidate` valida con `validateCandidateData`.
4. Se crea un `Candidate` y se guarda con Prisma.
5. Luego se guardan educaciones, experiencias y CV en operaciones separadas.
6. Si alguna operacion secundaria falla, no hay transaccion que revierta el candidato ya creado.

## 4. Estructura de carpetas

```text
.
├── backend
│   ├── api-spec.yaml
│   ├── jest.config.js
│   ├── package.json
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src
│       ├── application
│       │   ├── services
│       │   │   ├── candidateService.ts
│       │   │   └── fileUploadService.ts
│       │   └── validator.ts
│       ├── domain
│       │   └── models
│       ├── index.ts
│       ├── presentation
│       │   └── controllers
│       │       └── candidateController.ts
│       └── routes
│           └── candidateRoutes.ts
├── frontend
│   ├── public
│   └── src
│       ├── components
│       ├── services
│       ├── App.js
│       ├── App.tsx
│       └── index.tsx
├── docker-compose.yml
├── README.md
└── package.json
```

Observaciones:

- El README menciona `backend/src/infrastructure` y `backend/src/tests`, pero no existen.
- Hay dos archivos de entrada de app en frontend: `App.js` y `App.tsx`.
- El backend esta en TypeScript; el frontend mezcla TypeScript y JavaScript.

## 5. Capas existentes

### Controllers

Archivo principal: `backend/src/presentation/controllers/candidateController.ts`.

- `addCandidateController`: existe, pero no se usa en las rutas actuales.
- `getCandidateById`: se usa para `GET /candidates/:id`.
- Reexporta `addCandidate`, lo que permite que la ruta POST invoque directamente el servicio.

### Routes

Archivo principal: `backend/src/routes/candidateRoutes.ts`.

- `POST /candidates`: crea candidato.
- `GET /candidates/:id`: obtiene candidato por ID.

Archivo `backend/src/index.ts`:

- `POST /upload`: sube archivo CV.
- `GET /`: health/saludo simple.

### Services

- `candidateService.ts`: caso de uso para alta y consulta de candidato.
- `fileUploadService.ts`: configuracion y handler de Multer.

### Domain models

Cada entidad tiene una clase en `backend/src/domain/models`. La mayoria implementa:

- Constructor desde `data: any`.
- `save()` para crear o actualizar.
- `findOne(id)` en varias entidades.

Los modelos no son entidades puras: dependen de Prisma y escriben en base de datos.

### Repositories

No hay repositorios. El acceso a datos esta distribuido entre las clases de dominio.

### Validators

`backend/src/application/validator.ts` contiene validaciones manuales por regex y longitud para candidato, educacion, experiencia y CV.

## 6. Convenciones de codigo

- Backend con TypeScript estricto (`strict: true`) y CommonJS.
- Prettier configurado con comillas simples y trailing commas.
- ESLint solo extiende `plugin:prettier/recommended`.
- Comentarios mezclados en espanol e ingles.
- Uso frecuente de `any`, incluso en constructores y servicios.
- Convencion de modelo: clase por entidad con `save()` y a veces `findOne()`.
- La validacion se hace manualmente, no con DTOs, schemas o middleware especializado.
- URLs y puertos estan hardcodeados en varias partes (`3010`, `localhost:3000`, URLs de API en frontend).

## 7. Flujo de autenticacion

No se detecta autenticacion implementada.

No hay uso de JWT, sesiones, cookies de autenticacion, Passport, bcrypt, middlewares de autorizacion, login, registro ni validacion de roles. Aunque existe el modelo `Employee` con `role` e `isActive`, no hay endpoints ni servicios que autentiquen empleados o restrinjan acciones.

Estado actual:

- `POST /candidates` es publico.
- `GET /candidates/:id` es publico.
- `POST /upload` es publico.
- CORS esta limitado a `http://localhost:3000`, pero eso no constituye seguridad de API.

## 8. Endpoints existentes relevantes

### `GET /`

Definido en `backend/src/index.ts`.

- Respuesta: texto `Hola LTI!`.
- Uso: endpoint basico de verificacion.

### `POST /candidates`

Definido en `backend/src/routes/candidateRoutes.ts`.

Crea un candidato con datos basicos, educaciones, experiencias laborales y CV opcional.

Payload esperado:

- `firstName`
- `lastName`
- `email`
- `phone`
- `address`
- `educations[]`
- `workExperiences[]`
- `cv`

Respuesta real:

- `201`: devuelve el candidato creado por Prisma, normalmente solo los campos del candidato base.
- `400`: devuelve `{ message }` para errores capturados como `Error`.
- `500`: solo si el error no es instancia de `Error`.

Diferencia importante:

- `addCandidateController` devolveria `{ message, data }`, pero la ruta no lo usa.
- `api-spec.yaml` documenta un contrato amplio, pero la implementacion real puede devolver una forma distinta.

### `GET /candidates/:id`

Definido en `backend/src/routes/candidateRoutes.ts` y `candidateController.ts`.

Busca candidato por ID e incluye relaciones con educaciones, experiencias, resumes, aplicaciones, posiciones e entrevistas desde Prisma. Luego transforma el resultado a `new Candidate(data)`.

Riesgo: el constructor de `Candidate` espera `education` y `workExperience`, pero Prisma devuelve `educations` y `workExperiences`. Por eso la respuesta serializada puede perder esas colecciones o devolverlas como arreglos vacios bajo nombres distintos.

### `POST /upload`

Definido en `backend/src/index.ts` y `fileUploadService.ts`.

Sube un archivo en campo multipart `file`.

Acepta:

- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Limite:

- 10 MB.

Respuesta:

- `200`: `{ filePath, fileType }`.
- `400`: tipo de archivo invalido.
- `500`: errores de Multer u otros errores.

## 9. Modelo de datos detectado

Base de datos: PostgreSQL via Prisma.

### Candidate

Campos:

- `id`
- `firstName`
- `lastName`
- `email` unico
- `phone`
- `address`

Relaciones:

- 1:N con `Education`.
- 1:N con `WorkExperience`.
- 1:N con `Resume`.
- 1:N con `Application`.

### Education

Pertenece a `Candidate`.

Campos principales:

- `institution`
- `title`
- `startDate`
- `endDate`
- `candidateId`

### WorkExperience

Pertenece a `Candidate`.

Campos principales:

- `company`
- `position`
- `description`
- `startDate`
- `endDate`
- `candidateId`

### Resume

Pertenece a `Candidate`.

Campos principales:

- `filePath`
- `fileType`
- `uploadDate`
- `candidateId`

### Company

Relaciones:

- 1:N con `Employee`.
- 1:N con `Position`.

### Employee

Pertenece a `Company`.

Relaciones:

- 1:N con `Interview`.

Campos relevantes:

- `email` unico
- `role`
- `isActive`

### InterviewType

Representa tipos de entrevista, por ejemplo HR o tecnica.

Relaciones:

- 1:N con `InterviewStep`.

### InterviewFlow

Representa un flujo de entrevistas.

Relaciones:

- 1:N con `InterviewStep`.
- 1:N con `Position`.

### InterviewStep

Paso dentro de un flujo.

Relaciones:

- N:1 con `InterviewFlow`.
- N:1 con `InterviewType`.
- 1:N con `Application` como paso actual.
- 1:N con `Interview`.

### Position

Oferta o posicion laboral.

Relaciones:

- N:1 con `Company`.
- N:1 con `InterviewFlow`.
- 1:N con `Application`.

### Application

Postulacion de un candidato a una posicion.

Relaciones:

- N:1 con `Position`.
- N:1 con `Candidate`.
- N:1 con `InterviewStep` mediante `currentInterviewStep`.
- 1:N con `Interview`.

### Interview

Entrevista concreta dentro de una aplicacion.

Relaciones:

- N:1 con `Application`.
- N:1 con `InterviewStep`.
- N:1 con `Employee`.

## 10. Relaciones entre tablas involucradas

Relacion principal del flujo de candidatos:

```text
Candidate
├── Education[]
├── WorkExperience[]
├── Resume[]
└── Application[]
    ├── Position
    │   ├── Company
    │   └── InterviewFlow
    │       └── InterviewStep[]
    ├── InterviewStep actual
    └── Interview[]
        ├── InterviewStep
        └── Employee
            └── Company
```

Notas de integridad:

- Las foreign keys usan `ON DELETE RESTRICT`, por lo que no se pueden borrar padres con hijos existentes sin limpiar relaciones.
- No se detectan indices compuestos para busquedas frecuentes como `Application(candidateId, positionId)`.
- No hay constraint unico para evitar que un mismo candidato aplique dos veces a la misma posicion.
- No hay constraint que asegure que `Application.currentInterviewStep` pertenezca al `InterviewFlow` de la `Position`.
- No hay constraint que asegure unicidad de `InterviewStep.orderIndex` dentro de un mismo `InterviewFlow`.

## 11. Riesgos tecnicos encontrados

1. Credenciales y URL de base de datos hardcodeadas en `backend/prisma/schema.prisma`.
   - Riesgo de seguridad y de configuracion divergente con Docker/.env.

2. Multiples instancias de `PrismaClient`.
   - `index.ts` crea una instancia.
   - Cada modelo crea otra instancia propia.
   - Riesgo de exceso de conexiones y dificil manejo del ciclo de vida.

3. Persistencia sin transacciones en alta de candidato.
   - Se crea primero el candidato y luego se crean educacion, experiencia y CV.
   - Si falla una operacion secundaria, queda informacion parcial.

4. Ausencia de autenticacion/autorizacion.
   - Todos los endpoints actuales son publicos.
   - El modelo `Employee.role` no se usa para seguridad.

5. Contratos inconsistentes entre OpenAPI, controller y route.
   - `api-spec.yaml`, `addCandidateController` y `candidateRoutes.ts` describen respuestas distintas.

6. Subida de archivos con ruta relativa `../uploads/`.
   - Depende del directorio desde donde se arranque el proceso.
   - Si la carpeta no existe, la subida puede fallar.
   - No se detecta exposicion estatica ni gestion posterior de archivos subidos.

7. Falta de pruebas automatizadas.
   - Existe Jest configurado, pero no hay tests.
   - Los flujos criticos de candidato, upload y consulta no tienen cobertura.

8. Mezcla de responsabilidades.
   - Los modelos de dominio validan parcialmente, persisten y transforman datos.
   - Los servicios tambien orquestan persistencia.
   - Los controllers no concentran todo el contrato HTTP.

9. Configuracion CORS rigida.
   - Solo permite `http://localhost:3000`.
   - No hay estrategia por ambiente.

10. Frontend con URLs hardcodeadas al backend.
    - Dificulta despliegues y entornos distintos.

## 12. Posibles bugs detectados

1. `GET /candidates/:id` puede perder educaciones y experiencias.
   - Prisma devuelve `educations` y `workExperiences`.
   - `Candidate` espera `education` y `workExperience`.
   - Resultado probable: arrays vacios o nombres inconsistentes en la respuesta.

2. `POST /candidates` no es atomico.
   - Si falla guardar educacion, experiencia o CV despues de crear el candidato, queda un candidato incompleto.

3. El logger de requests esta registrado despues de `/candidates` y `/upload`.
   - Las rutas que responden antes no pasan por ese middleware.
   - No se loguean los endpoints principales.

4. `addCandidateController` no se usa.
   - La ruta POST llama al servicio directamente.
   - Hay dos contratos de respuesta potenciales.

5. Errores de infraestructura pueden devolverse como 400.
   - En `POST /candidates`, cualquier `Error` termina como Bad Request.
   - Una caida de base de datos podria reportarse al cliente como error de validacion.

6. `Resume` en creacion anidada no incluye `uploadDate`.
   - En `Candidate.save()`, si se usara `this.resumes` para crear resumes anidados, faltaria un campo obligatorio.
   - Hoy el servicio guarda CV por separado, pero la rama anidada queda riesgosa.

7. Validacion de telefono inconsistente.
   - API spec acepta formato internacional amplio.
   - `validator.ts` solo acepta numeros espanoles que empiecen con 6, 7 o 9 y tengan 9 digitos.
   - El seed contiene telefonos de 10 digitos que no pasarian la validacion del API.

8. Validacion de `Education.title` inconsistente.
   - Prisma permite 250 caracteres.
   - `validator.ts` limita a 100.
   - `api-spec.yaml` tambien documenta 100.

9. `frontend/src/services/candidateService.js` usa `axios`, pero no esta en dependencias.
   - Si este servicio se importa en algun flujo, fallara el build/runtime.

10. Manejo incorrecto de `new Error` en frontend.
    - Se llama `new Error('mensaje', error.response.data)`.
    - JavaScript ignora el segundo argumento en este uso, perdiendo detalle.

11. Dos entradas `App` en frontend.
    - `App.js` contiene la app real con rutas.
    - `App.tsx` conserva la pantalla default de CRA.
    - `index.tsx` importa `./App` sin extension, lo que puede generar ambiguedad segun resolucion del bundler.

12. `InterviewStep.orderIndex` duplicado en seed.
    - Para el mismo flujo, `Technical Interview` y `Manager Interview` usan `orderIndex: 2`.
    - Puede romper ordenamiento o avance del flujo.

13. File upload acepta por MIME declarado por cliente.
    - No valida contenido real ni extension final.
    - Puede permitir archivos maliciosos con MIME manipulado.

14. El archivo subido conserva `file.originalname`.
    - Riesgo de nombres problematicos si no se sanitiza.

## 13. Deuda tecnica encontrada

- Falta separar dominio, aplicacion e infraestructura de forma consistente.
- Falta una capa de repositorios o un servicio compartido de Prisma.
- Falta centralizar configuracion por ambiente.
- Falta eliminar secretos hardcodeados.
- Falta definir DTOs y validacion declarativa.
- Falta un contrato OpenAPI sincronizado con la implementacion real.
- Falta montar Swagger UI o remover dependencias/documentacion no usada.
- Falta cobertura de tests unitarios e integracion.
- Falta estrategia de errores uniforme.
- Falta paginacion/listado para candidatos si el sistema crecera.
- Falta endpoints para entidades ya modeladas: posiciones, aplicaciones, entrevistas, empresas, empleados y flujos.
- Falta autenticacion para empleados/reclutadores.
- Falta politica de almacenamiento y acceso a CVs.
- Falta normalizar idioma de codigo, mensajes y comentarios.
- Falta revisar migraciones historicas con cambios agregados y revertidos, como `Application.status`.
- Falta alinear frontend JavaScript/TypeScript y eliminar archivos duplicados.

## 14. Dudas y puntos a confirmar antes de implementar cambios futuros

1. ¿El sistema debe tener autenticacion de reclutadores/empleados o por ahora es una API abierta para practica?
2. ¿El candidato debe poder aplicar a varias posiciones desde la API actual o ese flujo pertenece a una fase posterior?
3. ¿El CV debe almacenarse localmente, en base de datos o en un servicio externo tipo S3?
4. ¿La API debe usar el contrato de `api-spec.yaml` como fuente de verdad o se debe ajustar la spec a la implementacion actual?
5. ¿El dominio objetivo es Espana para validacion de telefono o debe aceptar telefonos internacionales?
6. ¿Se espera que `Application` tenga estado propio, considerando que la migracion lo agrego y luego lo elimino?

## 15. Resumen ejecutivo

El proyecto tiene una base funcional para registrar candidatos con CV y consultar candidatos por ID, pero la arquitectura todavia esta en una etapa temprana. La mayor prioridad tecnica antes de ampliar funcionalidad seria estabilizar configuracion, seguridad, acceso a datos, transacciones y contratos API. El mayor riesgo funcional inmediato esta en la creacion no atomica de candidatos y en la transformacion incorrecta de relaciones al consultar candidatos.
