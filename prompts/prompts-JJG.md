## PROMPT 1

Como ingeniero experto en backend, necesito que analices el proyecto y crees 2 nuevos endpoint que permitan manipular la lista de candidatos. Siempre respetando la estructura del proyecto y haciendo buenas prácticas de backend. 
 - El 1er endpoint (GET /positions/:id/candidates):
    - Debe recoger los candidatos en proceso para una determinada posición.
     - Debe retornar:
           - El nombre completo del candidato (tabla candidate)
           - En qué fase del proceso está (tabla application)
           - La puntuación media del candidato (cada entrevista realizada por el candidato tiene un scrore).

    - El 2do endpoint (PUT /candidates/:id/stage):
       - Su misión es modificar la fase actual del proceso de entrevista en la que se encuentra el candidato

## PROMPT 2

La documentación que creaste añadela en /backend/documentacion quitándola de la ubicación actual