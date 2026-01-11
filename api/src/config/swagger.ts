import swaggerJSDoc from "swagger-jsdoc";
import { config } from ".";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aman",
      version: "1.0.0",
      description: "Api documentation for Aman Escrow",
    },
    servers: [
      {
        url: `https://localhost:${config.port}`,
      },
    ],
  },
  apis: ["./src/routes/**/*.ts"],
});
