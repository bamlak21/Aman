import express from "express";
import cors from "cors";
import { config } from "./config/index";
import { connectDB } from "./config/db";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";

// Initialize express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests

// swagger doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes (example)
app.get("/", async (_req, res) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRoutes);

// Start server
async function startServer() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

startServer();
