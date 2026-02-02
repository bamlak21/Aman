import express from "express";
import cors from "cors";
import { config } from "./config/index";
import { connectDB } from "./config/db";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import escrowRoutes from "./routes/escrow.route";
import { errorHandler } from "./middleware/error.middleware";

// Initialize express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json()); // Parse JSON requests

// swagger doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes (example)
app.get("/", async (_req, res) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/escrow", escrowRoutes);

// Error handler middleware
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

startServer();
