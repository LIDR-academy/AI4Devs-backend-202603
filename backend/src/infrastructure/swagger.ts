import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'LTI ATS API',
        version: '1.0.0',
        description: 'API documentation for the LTI Applicant Tracking System.',
    },
    servers: [
        { url: 'http://localhost:3010', description: 'Local development server' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description:
                    'Signed JWT with payload { userId, role }, verified against JWT_SECRET. ' +
                    'Example role values: recruiter, admin.',
            },
        },
    },
};

const options: swaggerJSDoc.Options = {
    swaggerDefinition,
    // Scan the route files for @swagger JSDoc annotations.
    apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
