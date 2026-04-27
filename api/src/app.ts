import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import escrowRoutes from "./routes/escrow.route";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/error.middleware";
import cookieParser from "cookie-parser";

// Initialize express app
export const app = express();

app.use(express.json()); // Parse JSON requests
app.use(cookieParser());

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// swagger doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes (example)
app.get("/", async (_req, res) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/users", userRoutes);

// Error handler middleware
app.use(errorHandler);
