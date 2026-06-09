## Prompt 1.
Actúa como un ingeniero de software para revisar todo el codebase y generar un fichero agents.md para el frontend y otro para el backend. Sigue los estándares definidos en https://agents.md/ Si tienes cualquier duda hazme las preguntas necesarias

## Prompt 2
Actúa como un ingeniero de software. Vamos a implementar el siguiente endpoint:
GET /positions/:id/candidates
Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar la siguiente información básica:
- Nombre completo del candidato (de la tabla candidate).
- current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score.

Revisa si hay incongruencias con el código actual o algun breaking change que pueda ser generado. Para finalizar, define un plan con todo el desarrollo necesario. Si tienes cualquier duda hazme las preguntas necesarias.

## Prompt 3
Actúa como un ingeniero de software. Vamos a implementar el siguiente endpoint:
PUT /candidates/:id/stage
Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico. Si tienes cualquier duda hazme las preguntas necesarias.

### Prompt 3 - Problema detectado
Hay un problema de diseño que necesito resolver contigo antes de planificar.
El problema
El endpoint es PUT /candidates/:id/stage, pero currentInterviewStep no es un campo de Candidate — pertenece a Application:
Application {
  id: Int
  candidateId: Int      ← FK al candidato
  positionId: Int
  currentInterviewStep: Int  ← la etapa actual
  ...
}
Un candidato puede tener múltiples applications (para distintas posiciones), cada una con su propia etapa. Por lo tanto, el endpoint necesita saber a qué application pertenece el stage que quieres actualizar.

### Prompt 3 - Solución
El endpoint pasará a ser  /applications/:id/stage, haciendo así un uso más puro de REST y solucionando el problema detectado.