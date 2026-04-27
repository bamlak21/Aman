import { config } from "./config/index";
import { connectDB } from "./config/db";
import { app } from "./app";

// Start server
async function startServer() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

startServer();
