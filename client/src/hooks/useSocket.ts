import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = import.meta.env.VITE_BASE_API_URL || "http://localhost:3000";

export const useSocket = (disputeId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["polling", "websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message, err);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (disputeId && socketRef.current?.connected) {
      socketRef.current.emit("join-dispute", disputeId);
      return () => {
        socketRef.current?.emit("leave-dispute", disputeId);
      };
    }
  }, [disputeId, isConnected]);

  const sendMessage = (disputeId: string, message: string) => {
    socketRef.current?.emit("send-message", { disputeId, message });
  };

  const sendTyping = (disputeId: string, isTyping: boolean) => {
    socketRef.current?.emit("typing", { disputeId, isTyping });
  };

  const onNewMessage = (handler: (msg: any) => void) => {
    socketRef.current?.on("new-message", handler);
    return () => {
      socketRef.current?.off("new-message", handler);
    };
  };

  const onUserTyping = (handler: (data: any) => void) => {
    socketRef.current?.on("user-typing", handler);
    return () => {
      socketRef.current?.off("user-typing", handler);
    };
  };

  const onOnlineUsers = (handler: (count: number) => void) => {
    socketRef.current?.on("online-users", handler);
    console.log(handler);
    
    return () => {
      socketRef.current?.off("online-users", handler);
    };
  };

  const onError = (handler: (msg: string) => void) => {
    socketRef.current?.on("error", handler);
    return () => {
      socketRef.current?.off("error", handler);
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
    onOnlineUsers,
    onError,
  };
};
