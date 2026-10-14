import { api } from "./main";

export type ChatMessage = {
  id: string;
  chatroomId: string;
  senderId: string;
  senderRole: "user" | "admin" | "system";
  senderName?: string;
  message: string;
  createdAt: string;
};

export type ChatroomData = {
  id: string;
  disputeId: string;
  adminId: string | null;
  createdAt: string;
};

export type LastMessage = {
  id: string;
  chatroomId: string;
  senderId: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
};

export type AdminChatItem = {
  dispute: {
    id: string;
    escrow_id: string;
    dispute_type: string;
    status: string;
    reason: string;
    reporter_id: string;
    reported_id: string;
    createdAt: string;
    updatedAt: string;
  };
  chatroom: ChatroomData;
  lastMessage: LastMessage | null;
};

export const chat = {
  getAdminChats: async () => {
    const res = await api.get("/api/chat/admin");
    return res.data as AdminChatItem[];
  },

  getDisputeChatroom: async (disputeId: string) => {
    const res = await api.get(`/api/chat/${disputeId}/room`);
    return res.data as {
      chatroom: ChatroomData;
      messages: ChatMessage[];
      dispute_type: string;
      status: string;
      reason: string;
    };
  },
};
