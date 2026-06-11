---
description: "Registra el último prompt significativo en el diario de prompts"
argument-hint: "[descripción breve — ej: contrato GET /positions/:id/candidates]"
---

Añade una entrada en `prompts/prompts-iniciales.md` con el formato estándar. Crea el fichero si no existe.

## Formato de entrada

```markdown
## [YYYY-MM-DD] — <objetivo en una línea>

**Prompt usado:**
> <cita literal o resumen fiel del prompt>

**Lo que generó:**
- <artefacto 1 — fichero, diff, tests>
- <artefacto 2>

**Correcciones necesarias:**
- <corrección 1> (o "ninguna" si fue perfecto al primer intento)

**Lecciones:**
- <qué añadir o quitar en prompts similares futuros>
```

## Instrucciones

- La fecha es siempre la de hoy en formato `YYYY-MM-DD`.
- "Lo que generó" describe los artefactos reales producidos, no intenciones.
- "Correcciones necesarias" registra qué hubo que ajustar después del primer output del modelo.
- "Lecciones" es la parte más valiosa: patrones para mejorar prompts similares.
- Si el fichero ya existe, **añade la nueva entrada al final** (no sobreescribas el historial).
