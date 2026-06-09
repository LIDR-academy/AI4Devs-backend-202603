# 📚 Documentación - Nuevos Endpoints de Candidatos

Bienvenido a la documentación de los nuevos endpoints implementados en el backend. Esta carpeta contiene toda la información necesaria para entender, usar y probar los nuevos endpoints de manipulación de candidatos.

---

## 📑 Archivos de Documentación

### 1. 📋 [NUEVOS_ENDPOINTS.md](NUEVOS_ENDPOINTS.md)
**Descripción técnica completa de los endpoints**

Contiene:
- Especificación detallada de cada endpoint
- Formato de request/response
- Códigos de estado HTTP
- Validaciones implementadas
- Arquitectura de la solución
- Ejemplos de uso completo

👉 **Léeme si**: Necesitas entender qué hace cada endpoint y cómo usarlo.

---

### 2. 🔄 [DIAGRAMA_FLUJO.md](DIAGRAMA_FLUJO.md)
**Diagramas visuales del flujo de datos**

Contiene:
- Diagrama de flujo para GET /positions/:id/candidates
- Diagrama de flujo para PUT /candidates/:id/stage
- Estructura de carpetas actualizada
- Tabla resumen de cambios
- Estadísticas de código

👉 **Léeme si**: Prefieres entender visualmente cómo funciona cada endpoint.

---

### 3. 🧪 [PRUEBAS_ENDPOINTS.md](PRUEBAS_ENDPOINTS.md)
**Ejemplos prácticos de prueba con cURL y Postman**

Contiene:
- Ejemplos de cURL para cada caso de uso
- Scripts de prueba bash
- Configuración de Postman
- Checklist de pruebas
- Solución de problemas comunes

👉 **Léeme si**: Quieres probar los endpoints o entender cómo hacerlo.

---

## 🚀 Inicio Rápido

### 1. Entender los endpoints (5 minutos)
1. Lee [NUEVOS_ENDPOINTS.md](NUEVOS_ENDPOINTS.md) - sección "Resumen de Implementación"
2. Revisa los códigos de estado HTTP y validaciones

### 2. Ver cómo funcionan (3 minutos)
1. Abre [DIAGRAMA_FLUJO.md](DIAGRAMA_FLUJO.md)
2. Analiza los diagramas ASCII del flujo de datos

### 3. Probar los endpoints (10 minutos)
1. Abre [PRUEBAS_ENDPOINTS.md](PRUEBAS_ENDPOINTS.md)
2. Copia un comando cURL y pruébalo en tu terminal
3. Verifica que obtienes la respuesta esperada

---

## 📋 Endpoints Disponibles

### GET /positions/:id/candidates
**Obtiene candidatos en proceso para una posición**

```bash
curl -X GET "http://localhost:3010/positions/1/candidates"
```

**Retorna**:
- Lista de candidatos
- Nombre completo
- Fase actual
- Puntuación media de entrevistas

**Archivos relacionados**:
- [NUEVOS_ENDPOINTS.md](NUEVOS_ENDPOINTS.md#-endpoint-1-getpositionsidcandidates) - Especificación
- [DIAGRAMA_FLUJO.md](DIAGRAMA_FLUJO.md#️-flujo-del-endpoint-getpositionsidcandidates) - Diagrama
- [PRUEBAS_ENDPOINTS.md](PRUEBAS_ENDPOINTS.md#-endpoint-1-getpositionsidcandidates) - Ejemplos de prueba

---

### PUT /candidates/:id/stage
**Actualiza la fase del candidato en el proceso**

```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -H "Content-Type: application/json" \
  -d '{"newStageId": 3}'
```

**Parámetros**:
- `newStageId` (number): ID de la nueva fase de entrevista

**Retorna**:
- Confirmación de actualización
- Datos del candidato
- Nueva fase asignada

**Archivos relacionados**:
- [NUEVOS_ENDPOINTS.md](NUEVOS_ENDPOINTS.md#-endpoint-2-putcandidatesidstage) - Especificación
- [DIAGRAMA_FLUJO.md](DIAGRAMA_FLUJO.md#️-flujo-del-endpoint-putcandidatesidstage) - Diagrama
- [PRUEBAS_ENDPOINTS.md](PRUEBAS_ENDPOINTS.md#-endpoint-2-putcandidatesidstage) - Ejemplos de prueba

---

## 🏗️ Estructura de Archivos Modificados

```
backend/
├── src/
│   ├── index.ts (✏️ Actualizado)
│   ├── application/services/
│   │   └── candidateService.ts (✏️ Actualizado - 2 funciones nuevas)
│   ├── presentation/controllers/
│   │   └── candidateController.ts (✏️ Actualizado - 2 controladores nuevos)
│   └── routes/
│       ├── candidateRoutes.ts (✏️ Actualizado - 1 ruta nueva)
│       └── positionRoutes.ts (✨ NUEVO)
│
└── documentacion/ (📁 ESTA CARPETA)
    ├── README.md (este archivo)
    ├── NUEVOS_ENDPOINTS.md
    ├── DIAGRAMA_FLUJO.md
    └── PRUEBAS_ENDPOINTS.md
```

---

## ✅ Características Implementadas

- ✅ **Validación robusta** - Verificación de tipos y existencia de recursos
- ✅ **Manejo de errores completo** - Códigos HTTP apropiados (200, 400, 404, 500)
- ✅ **Arquitectura de 3 capas** - Controllers → Services → Models/Prisma
- ✅ **Cálculo inteligente** - Promedio de scores con validación
- ✅ **Tipado fuerte** - Todo en TypeScript
- ✅ **Documentación inline** - JSDoc en todas las funciones

---

## 🔄 Patrón de Arquitectura

Los endpoints siguen el patrón de arquitectura de 3 capas existente:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (Controllers)    │ ← Recibe y valida requests
├─────────────────────────────────────────┤
│      Application Layer (Services)       │ ← Lógica de negocio
├─────────────────────────────────────────┤
│  Domain Layer (Models) & Prisma Client  │ ← Acceso a BD
└─────────────────────────────────────────┘
```

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Líneas de código nuevas | ~120 |
| Archivos modificados | 5 |
| Archivos creados | 1 (positionRoutes.ts) |
| Nuevas funciones en servicio | 2 |
| Nuevos controladores | 2 |
| Nuevas rutas | 1 (GET) + 1 actualización (PUT) |

---

## 🆘 Solución de Problemas

### El endpoint retorna 404
→ Verifica que la posición o candidato exista en la BD

### El endpoint retorna 400
→ Revisa que los parámetros sean del tipo correcto (números para IDs)

### El endpoint retorna 500
→ Revisa los logs del servidor: `npm run dev`

### La puntuación media no es correcta
→ Verifica que las entrevistas tengan un `score` asignado (no null)

👉 Para más soluciones, ver [PRUEBAS_ENDPOINTS.md](PRUEBAS_ENDPOINTS.md#-solución-de-problemas)

---

## 🎯 Casos de Uso

### Caso 1: Ver candidatos de una posición
```bash
curl -X GET "http://localhost:3010/positions/1/candidates"
```
**Resultado**: Ves todos los candidatos para esa posición con sus fases y puntuaciones

### Caso 2: Avanzar a un candidato a la siguiente fase
```bash
curl -X PUT "http://localhost:3010/candidates/1/stage" \
  -d '{"newStageId": 3}'
```
**Resultado**: El candidato se mueve a la nueva fase automáticamente

### Caso 3: Flujo completo de evaluación
1. GET candidatos y revisa sus puntuaciones
2. Selecciona el mejor candidato
3. PUT para avanzar a siguiente fase
4. Repite hasta que el candidato sea contratado

---

## 📞 Contacto y Soporte

Para preguntas sobre la implementación:
- Revisa los comentarios JSDoc en el código fuente
- Consulta la documentación en esta carpeta
- Verifica los logs del servidor durante la ejecución

---

## 📝 Notas Adicionales

- Los endpoints utilizan **Prisma** como ORM
- La base de datos es **PostgreSQL**
- Todos los parámetros son validados antes de procesarse
- Las respuestas siempre usan formato **JSON**
- Se implementaron todas las validaciones recomendadas para producción

---

## 🔗 Referencias Rápidas

- [Especificación Técnica](NUEVOS_ENDPOINTS.md)
- [Diagramas de Flujo](DIAGRAMA_FLUJO.md)
- [Ejemplos de Prueba](PRUEBAS_ENDPOINTS.md)
- [Solución de Problemas](PRUEBAS_ENDPOINTS.md#-solución-de-problemas)

---

**Última actualización**: 2026-06-09
**Versión**: 1.0
