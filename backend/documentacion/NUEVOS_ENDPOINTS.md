# Documentación - Nuevos Endpoints de Candidatos

## Resumen de Implementación

Se han creado 2 nuevos endpoints para manipular la lista de candidatos, respetando la arquitectura y buenas prácticas del backend.

---

## 📋 Endpoint 1: GET /positions/:id/candidates

### Descripción
Obtiene todos los candidatos en proceso para una determinada posición, incluyendo:
- Nombre completo del candidato
- Fase actual del proceso
- Puntuación media de las entrevistas realizadas

### Request
```http
GET /positions/1/candidates
```

### Response
```json
{
  "message": "Candidates retrieved successfully",
  "data": [
    {
      "candidateId": 1,
      "fullName": "Juan Pérez",
      "email": "juan@example.com",
      "currentStage": "Technical Interview",
      "currentStageId": 3,
      "averageScore": 8.5,
      "totalInterviews": 2,
      "applicationDate": "2024-05-28T10:00:00Z"
    },
    {
      "candidateId": 2,
      "fullName": "María García",
      "email": "maria@example.com",
      "currentStage": "Initial Screening",
      "currentStageId": 1,
      "averageScore": 0,
      "totalInterviews": 0,
      "applicationDate": "2024-05-29T14:30:00Z"
    }
  ],
  "total": 2
}
```

### Códigos de Estado
- **200 OK**: Candidatos obtenidos exitosamente
- **400 Bad Request**: ID de posición inválido
- **404 Not Found**: La posición no existe
- **500 Internal Server Error**: Error del servidor

### Detalles Técnicos
- **Ubicación**: `src/routes/positionRoutes.ts`
- **Controlador**: `getCandidatesByPositionController` en `src/presentation/controllers/candidateController.ts`
- **Servicio**: `getCandidatesByPosition` en `src/application/services/candidateService.ts`

---

## 📋 Endpoint 2: PUT /candidates/:id/stage

### Descripción
Actualiza la fase actual del proceso de entrevista en la que se encuentra un candidato.

### Request
```http
PUT /candidates/1/stage
Content-Type: application/json

{
  "newStageId": 3
}
```

**Body Parameters:**
- `newStageId` (number, required): ID de la nueva fase de entrevista (InterviewStep)

### Response
```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "applicationId": 5,
    "candidateId": 1,
    "candidateName": "Juan Pérez",
    "positionTitle": "Senior Backend Developer",
    "newStage": "Technical Interview",
    "newStageId": 3
  }
}
```

### Códigos de Estado
- **200 OK**: Fase actualizada exitosamente
- **400 Bad Request**: Parámetros inválidos o fase no existe
- **404 Not Found**: El candidato no existe
- **500 Internal Server Error**: Error del servidor

### Detalles Técnicos
- **Ubicación**: `src/routes/candidateRoutes.ts`
- **Controlador**: `updateCandidateStageController` en `src/presentation/controllers/candidateController.ts`
- **Servicio**: `updateCandidateStage` en `src/application/services/candidateService.ts`

---

## 🏗️ Arquitectura de la Solución

### Patrón de Capas (3-Layer Architecture)

```
Presentation Layer (Controllers)
    ↓
Application Layer (Services)
    ↓
Domain Layer (Models) & Database (Prisma)
```

### Flujo de Datos

#### GET /positions/:id/candidates
1. **positionRoutes.ts** → Recibe la solicitud GET
2. **getCandidatesByPositionController** → Valida parámetros y delega logística
3. **getCandidatesByPosition** → Consulta Prisma y calcula estadísticas
4. **Prisma Client** → Ejecuta queries a la base de datos

#### PUT /candidates/:id/stage
1. **candidateRoutes.ts** → Recibe la solicitud PUT
2. **updateCandidateStageController** → Valida candidato, body y delega logística
3. **updateCandidateStage** → Valida la nueva fase, actualiza Prisma
4. **Prisma Client** → Ejecuta UPDATE en la base de datos

---

## 📊 Relaciones en Base de Datos

```
Candidate (1) ─── (N) Application
Application ─── Position
Application ─── InterviewStep
Application (1) ─── (N) Interview
Interview ─── InterviewStep
Interview ─── Employee
```

### Cálculo de Puntuación Media
- Se obtienen todas las entrevistas del candidato para la posición
- Se filtran solo aquellas con `score !== null`
- La media se calcula como: `suma de scores / cantidad de entrevistas`
- Se retorna redondeado a 2 decimales

---

## 🔒 Validaciones Implementadas

### GET /positions/:id/candidates
- ✅ Validar que `positionId` sea un número válido
- ✅ Verificar que la posición existe en la BD
- ✅ Retornar lista vacía si no hay candidatos

### PUT /candidates/:id/stage
- ✅ Validar que `candidateId` sea un número válido
- ✅ Validar que `newStageId` existe en body y es número
- ✅ Verificar que el candidato existe en la BD
- ✅ Verificar que la nueva fase (InterviewStep) existe en la BD
- ✅ Validación de errores Prisma

---

## 📝 Buenas Prácticas Implementadas

1. **Separación de Responsabilidades**: Cada capa tiene un propósito específico
2. **Manejo de Errores**: Try-catch en todos los servicios y controladores
3. **Validación de Entrada**: Verificación de tipos y existencia de recursos
4. **Respuestas Consistentes**: Formato JSON uniforme en todos los endpoints
5. **Documentación**: Comentarios JSDoc en funciones principales
6. **Códigos HTTP Apropiados**: 200, 400, 404, 500 según corresponda
7. **Reutilización de Código**: Uso del cliente Prisma compartido
8. **Tipado Fuerte**: TypeScript en todos los archivos
9. **Query Optimization**: Uso de `include` en Prisma para relaciones

---

## 🧪 Ejemplo de Uso Completo

### Escenario: Actualizar candidato de "Initial Screening" a "Technical Interview"

#### Paso 1: Obtener candidatos de la posición
```bash
curl -X GET http://localhost:3010/positions/1/candidates
```

#### Paso 2: Ver la puntuación y fase actual
```json
{
  "candidateId": 1,
  "fullName": "Juan Pérez",
  "currentStage": "Initial Screening",
  "currentStageId": 1,
  "averageScore": 7.5
}
```

#### Paso 3: Actualizar a siguiente fase
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d '{"newStageId": 3}'
```

#### Paso 4: Confirmar cambio
```bash
curl -X GET http://localhost:3010/positions/1/candidates
```

---

## 📂 Archivos Modificados/Creados

| Archivo | Tipo | Cambios |
|---------|------|---------|
| `src/application/services/candidateService.ts` | Modificado | Agregadas funciones `getCandidatesByPosition` y `updateCandidateStage` |
| `src/presentation/controllers/candidateController.ts` | Modificado | Agregados controladores para los 2 nuevos endpoints |
| `src/routes/candidateRoutes.ts` | Modificado | Agregada ruta `PUT /:id/stage` |
| `src/routes/positionRoutes.ts` | Creado | Nuevo archivo con ruta `GET /:id/candidates` |
| `src/index.ts` | Modificado | Importado y registrado `positionRoutes` |

---

## ✅ Checklist de Verificación

- [x] Endpoints respetan la estructura del proyecto
- [x] Siguen el patrón de 3 capas existente
- [x] Validación de entrada completa
- [x] Manejo de errores robusto
- [x] Retornan respuestas consistentes en JSON
- [x] Utilizan Prisma para acceso a BD
- [x] Código tipado con TypeScript
- [x] Documentación en código (JSDoc)
- [x] Relaciones de BD correctamente consultadas
- [x] Cálculo de puntuación media verificado
