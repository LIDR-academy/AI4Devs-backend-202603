# Skill: express-openapi-validator

Guía de integración del middleware `express-openapi-validator` con el stack del proyecto (TypeScript 4.9.5 + Express + Jest). Convierte `backend/api-spec.yaml` en validación automática de requests y responses en runtime.

## Instalación

```bash
cd backend && npm install express-openapi-validator
```

Tipos incluidos en el paquete — no requiere `@types/express-openapi-validator`.

## Configuración en `backend/src/index.ts`

Añadir el middleware **después** de `express.json()` y **antes** de las rutas:

```typescript
import * as OpenApiValidator from 'express-openapi-validator';
import path from 'path';

// Después de: app.use(express.json())
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, '../../api-spec.yaml'),
    validateRequests: true,
    validateResponses: false,  // true sólo en tests/dev — penaliza producción
  })
);

// El manejo de errores del validador va DESPUÉS de las rutas
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.status && err.errors) {
    // Error de validación OpenAPI
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  }
  // Error genérico existente
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});
```

## En tests — activar `validateResponses: true`

Para que los tests de integración sean también tests de contrato:

```typescript
// backend/tests/setup.ts (o dentro de cada describe)
import * as OpenApiValidator from 'express-openapi-validator';

// Reemplaza la config del middleware en el app de test
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, '../../api-spec.yaml'),
    validateRequests: true,
    validateResponses: true,  // valida también la respuesta del servidor
  })
);
```

## Beneficios en este proyecto

1. **400 automático sin código manual**: si el request no cumple el schema del `api-spec.yaml`, el middleware devuelve 400 con detalles del campo problemático — sin `if (!req.body.x)` en controllers.

2. **Tests de integración = tests de contrato**: con `validateResponses: true` en tests, si el controller devuelve un campo nullable como `0` en lugar de `null`, el test falla automáticamente.

3. **Feedback inmediato**: el error incluye el endpoint y el campo exacto:
   ```json
   {
     "message": "request.params.id should be integer",
     "errors": [{ "path": ".params.id", "message": "should be integer" }]
   }
   ```

## Notas de compatibilidad

- Compatible con Express 4.x y TypeScript 4.9.5.
- El path a `api-spec.yaml` debe ser absoluto — usar `path.join(__dirname, ...)`.
- Si los tests usan `supertest` directamente sobre `app`, el middleware se aplica igual.
- `validateResponses: true` puede hacer fallar tests existentes si el response no coincide exactamente con el schema — revisar primero con los tests actuales.
