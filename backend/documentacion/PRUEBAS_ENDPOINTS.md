# Ejemplos de Prueba - cURL Commands

## 🧪 Pruebas de los Nuevos Endpoints

> **Nota**: Reemplaza los valores de ejemplo con IDs reales de tu base de datos

### Configuración Previa
```bash
# URL Base
BASE_URL="http://localhost:3010"

# Headers comunes
HEADERS="-H 'Content-Type: application/json'"
```

---

## 📍 Endpoint 1: GET /positions/:id/candidates

### ✅ Caso 1: Obtener candidatos de una posición existente

```bash
curl -X GET "http://localhost:3010/positions/1/candidates" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (200 OK):**
```json
{
  "message": "Candidates retrieved successfully",
  "data": [
    {
      "candidateId": 1,
      "fullName": "Juan Pérez López",
      "email": "juan.perez@example.com",
      "currentStage": "Initial Screening",
      "currentStageId": 1,
      "averageScore": 0,
      "totalInterviews": 0,
      "applicationDate": "2024-05-28T08:27:02.000Z"
    },
    {
      "candidateId": 2,
      "fullName": "María García Ruiz",
      "email": "maria.garcia@example.com",
      "currentStage": "Technical Interview",
      "currentStageId": 3,
      "averageScore": 8.5,
      "totalInterviews": 2,
      "applicationDate": "2024-05-28T08:50:16.000Z"
    },
    {
      "candidateId": 3,
      "fullName": "Carlos Rodríguez",
      "email": "carlos.rodriguez@example.com",
      "currentStage": "HR Interview",
      "currentStageId": 4,
      "averageScore": 7.25,
      "totalInterviews": 3,
      "applicationDate": "2024-05-28T11:05:22.000Z"
    }
  ],
  "total": 3
}
```

### ❌ Caso 2: Posición no existe (404)

```bash
curl -X GET "http://localhost:3010/positions/99999/candidates" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (404 Not Found):**
```json
{
  "error": "Position not found"
}
```

### ❌ Caso 3: ID inválido (400)

```bash
curl -X GET "http://localhost:3010/positions/abc/candidates" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "Invalid position ID format"
}
```

### 📊 Caso 4: Posición sin candidatos

```bash
curl -X GET "http://localhost:3010/positions/2/candidates" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (200 OK con array vacío):**
```json
{
  "message": "Candidates retrieved successfully",
  "data": [],
  "total": 0
}
```

---

## 📍 Endpoint 2: PUT /candidates/:id/stage

### ✅ Caso 1: Actualizar fase de candidato exitosamente

```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{
    "newStageId": 3
  }'
```

**Respuesta esperada (200 OK):**
```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "applicationId": 1,
    "candidateId": 1,
    "candidateName": "Juan Pérez López",
    "positionTitle": "Senior Backend Developer",
    "newStage": "Technical Interview",
    "newStageId": 3
  }
}
```

### ❌ Caso 2: Candidato no existe (404)

```bash
curl -X PUT "http://localhost:3010/candidates/99999/stage" \
  -H "Content-Type: application/json" \
  -d '{
    "newStageId": 2
  }'
```

**Respuesta esperada (404 Not Found):**
```json
{
  "error": "Candidate not found"
}
```

### ❌ Caso 3: newStageId no proporcionado (400)

```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "newStageId is required and must be a valid number"
}
```

### ❌ Caso 4: newStageId inválido (400)

```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{
    "newStageId": "abc"
  }'
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "newStageId is required and must be a valid number"
}
```

### ❌ Caso 5: Fase de entrevista no existe (400)

```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{
    "newStageId": 99999
  }'
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "La fase de entrevista especificada no existe"
}
```

### ❌ Caso 6: ID de candidato inválido (400)

```bash
curl -X PUT "http://localhost:3010/candidates/xyz/stage" \
  -H "Content-Type: application/json" \
  -d '{
    "newStageId": 2
  }'
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "Invalid candidate ID format"
}
```

---

## 🔍 Script de Prueba Completo (Bash)

```bash
#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3010"

echo -e "${BLUE}=== Testing GET /positions/:id/candidates ===${NC}\n"

# Test 1: GET valid position
echo -e "${GREEN}✓ Test 1: Obtener candidatos de posición existente${NC}"
curl -X GET "$BASE_URL/positions/1/candidates" \
  -H "Content-Type: application/json"
echo -e "\n\n"

# Test 2: GET non-existent position
echo -e "${GREEN}✓ Test 2: Posición no existente (404)${NC}"
curl -X GET "$BASE_URL/positions/99999/candidates" \
  -H "Content-Type: application/json"
echo -e "\n\n"

# Test 3: GET with invalid ID
echo -e "${GREEN}✓ Test 3: ID inválido (400)${NC}"
curl -X GET "$BASE_URL/positions/abc/candidates" \
  -H "Content-Type: application/json"
echo -e "\n\n"

echo -e "${BLUE}=== Testing PUT /candidates/:id/stage ===${NC}\n"

# Test 4: PUT valid update
echo -e "${GREEN}✓ Test 4: Actualizar fase de candidato${NC}"
curl -X PUT "$BASE_URL/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{"newStageId": 2}'
echo -e "\n\n"

# Test 5: PUT missing newStageId
echo -e "${GREEN}✓ Test 5: newStageId faltante (400)${NC}"
curl -X PUT "$BASE_URL/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{}'
echo -e "\n\n"

# Test 6: PUT non-existent candidate
echo -e "${GREEN}✓ Test 6: Candidato no existente (404)${NC}"
curl -X PUT "$BASE_URL/candidates/99999/stage" \
  -H "Content-Type: application/json" \
  -d '{"newStageId": 2}'
echo -e "\n\n"

# Test 7: PUT invalid stage ID
echo -e "${GREEN}✓ Test 7: Stage ID no existe (400)${NC}"
curl -X PUT "$BASE_URL/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{"newStageId": 99999}'
echo -e "\n"
```

---

## 🧪 Prueba con Postman

### Importar colección
1. Abre Postman
2. Haz clic en "Import"
3. Copia y pega el siguiente JSON:

```json
{
  "info": {
    "name": "Candidate Endpoints",
    "description": "Collection para probar los nuevos endpoints"
  },
  "item": [
    {
      "name": "GET - Candidatos por Posición",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3010/positions/1/candidates",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3010",
          "path": ["positions", "1", "candidates"]
        }
      }
    },
    {
      "name": "PUT - Actualizar Fase del Candidato",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"newStageId\": 3}"
        },
        "url": {
          "raw": "http://localhost:3010/candidates/1/stage",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3010",
          "path": ["candidates", "1", "stage"]
        }
      }
    }
  ]
}
```

---

## 📋 Checklist de Pruebas

- [ ] GET /positions/1/candidates - retorna 200 con datos válidos
- [ ] GET /positions/99999/candidates - retorna 404
- [ ] GET /positions/abc/candidates - retorna 400
- [ ] PUT /candidates/1/stage con newStageId válido - retorna 200
- [ ] PUT /candidates/1/stage sin newStageId - retorna 400
- [ ] PUT /candidates/99999/stage - retorna 404
- [ ] PUT /candidates/1/stage con newStageId inválido - retorna 400
- [ ] Verificar que la puntuación media se calcula correctamente
- [ ] Verificar que la fase se actualiza en la BD
- [ ] Verificar respuestas de error coherentes

---

## 🔧 Solución de Problemas

### Error: "Cannot POST /positions/:id/candidates"
- **Causa**: Intentaste usar POST en lugar de GET
- **Solución**: Usa `curl -X GET`

### Error: "Cannot PUT /candidates/:id"
- **Causa**: Intentaste hacer PUT sin `/stage`
- **Solución**: Asegúrate de usar `/candidates/:id/stage`

### Error: "Internal Server Error" (500)
- **Causa**: Error en el servidor o conexión a BD
- **Solución**: Revisa los logs del servidor: `npm run dev`

### Error: "newStageId is required"
- **Causa**: No incluiste `newStageId` en el body
- **Solución**: Envía `{"newStageId": 3}` en el body

### Error: "Position not found"
- **Causa**: La posición con ese ID no existe
- **Solución**: Verifica el ID de la posición en la BD

---

## 📊 Datos de Prueba Recomendados

Inserta estos datos en tu BD para pruebas:

```sql
-- Verificar posiciones existentes
SELECT id, title FROM "Position" LIMIT 5;

-- Verificar candidatos existentes
SELECT id, "firstName", "lastName" FROM "Candidate" LIMIT 5;

-- Verificar aplicaciones
SELECT id, "candidateId", "positionId", "currentInterviewStep" 
FROM "Application" LIMIT 5;

-- Verificar fases de entrevista
SELECT id, name FROM "InterviewStep" LIMIT 5;

-- Verificar entrevistas con scores
SELECT id, "applicationId", score 
FROM "Interview" WHERE score IS NOT NULL LIMIT 5;
```
