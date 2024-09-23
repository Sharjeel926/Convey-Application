const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Api for convay app",
      version: "1.0.0",
      description: "Documentation for convay app",
    },
    components: {
      securitySchema: {
        bearerAuth: {
          type: "http",
          schema: "bearer",
          bearerFormat: "jwt",
        },
      },
    },
  },
  apis: ["./swagger/doc.yaml"], ///swagger/doc.yam
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
module.exports = swaggerSpec;
