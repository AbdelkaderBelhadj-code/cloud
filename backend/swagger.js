const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'License Management API',
            version: '1.0.0',
            description: 'MERN Stack License & Equipment Management Dashboard API — NextStep IT',
            contact: { name: 'NextStep IT', email: 'cloud@nextstep-it.com' },
        },
        servers: [
            { url: 'http://localhost:5000/api', description: 'Local development' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // Path changed to relative from backend/ folder
    apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
