import { createServer } from "http";
import { config } from "./config/index";
import { connectDB } from "./config/db";
import { app } from "./app";
import { initSocket } from "./socket";
import { registerChatHandlers } from "./socket/chat.handler";
import { startOverdueNotifier } from "./jobs/overDueEscrowNotifier";

const httpServer = createServer(app);

const io = initSocket(httpServer);

io.on("connection", (socket) => {
  registerChatHandlers(io, socket);
});

async function startServer() {
  await connectDB();
  startOverdueNotifier();
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

startServer();

process.on("SIGUSR2", () => {
  httpServer.close(() => {
    process.exit(0);
  });
});
