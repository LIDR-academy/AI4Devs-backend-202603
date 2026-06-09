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