import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import escrowRoutes from "./routes/escrow.route";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import disputeRoutes from "./routes/dispute.routes";
import { errorHandler } from "./middleware/error.middleware";
import cookieParser from "cookie-parser";
import path from "path";

// Initialize express app
export const app = express();

app.use(express.json()); // Parse JSON requests
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174","http://localhost:5175"],
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
app.use("/api/admin", adminRoutes);
app.use("/api/dispute", disputeRoutes);
app.use("/api/dispute", disputeRoutes);

// Error handler middleware
app.use(errorHandler);
