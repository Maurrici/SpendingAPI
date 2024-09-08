import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import prisma from "./src/database/prisma.js";

// Settings
const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

// Swagger setup
const swaggerOptions = {
swaggerDefinition: {
    openapi: "3.0.0",
    info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation using Swagger",
    },
    components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
    servers: [
        {
            url: "http://localhost:3000",
        },
    ],
    apis: ["./src/controllers/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Controllers
import UserController from "./src/controllers/UserController.js";
import SpendingController from "./src/controllers/SpendingController.js";
import GroupController from "./src/controllers/GroupController.js";

// Routes
app.use("", UserController);
app.use("", SpendingController);
app.use("", GroupController);

app.listen(3000, (err) =>{
    if (err) {
        console.error("Error starting server:", err);
      } else {
        console.log("Server is running on http://localhost:3000");
        console.log("Swagger docs available on http://localhost:3000/api-docs");
      }
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    server.close(() => {
      console.log('Process terminated');
    });
});
  
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close(() => {
        console.log('Process interrupted');
    });
});