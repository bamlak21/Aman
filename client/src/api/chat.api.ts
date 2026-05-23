import { api } from "./main";

export type ChatMessage = {
  id: string;
  chatroomId: string;
  senderId: string;
  senderRole: "user" | "admin";
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

export type MyChatItem = {
  dispute: {
    id: string;
    escrow_id: string;
    dispute_type: string;
    status: string;
    reason: string;
    createdAt: string;
    updatedAt: string;
  };
  chatroom: ChatroomData | null;
  lastMessage: LastMessage | null;
};

export const chat = {
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

  getMyChats: async () => {
    const res = await api.get("/api/chat/my");
    return res.data as MyChatItem[];
  },
};
