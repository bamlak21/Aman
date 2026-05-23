import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send, MessageSquare, Shield, Search, ChevronDown,
  ChevronRight, RefreshCw, User, X,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { chat, type AdminChatItem, type ChatMessage } from "../api/chat.api";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_BASE_API_URL || "http://localhost:3000";

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    non_delivery: "Non-Delivery", quality_issue: "Quality Issue",
    fraud: "Fraud", breach_of_terms: "Breach of Terms", other: "Other",
  };
  return labels[type] || type;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });
};

const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const isSameSender = (a: ChatMessage, b: ChatMessage) =>
  a.senderId === b.senderId && a.senderRole === b.senderRole;

const TIME_GROUP_THRESHOLD = 5 * 60 * 1000;
const isWithinTimeGroup = (a: string, b: string) =>
  new Date(a).getTime() - new Date(b).getTime() < TIME_GROUP_THRESHOLD;

const TypingDots = () => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
      <User size={12} className="text-gray-500" />
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const AdminChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState<AdminChatItem[]>([]);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(searchParams.get("dispute"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [typingName, setTypingName] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [disputeInfo, setDisputeInfo] = useState<{ dispute_type: string; status: string; reason: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token }, transports: ["polling", "websocket"] });
    s.on("connect", () => { console.log("Admin socket connected"); setConnected(true); });
    s.on("disconnect", (reason) => { console.log("Admin socket disconnected:", reason); setConnected(false); });
    s.on("connect_error", (err) => console.error("Admin socket connect_error:", err.message, err));
    setSocket(s);
    return () => { s.disconnect(); };
  }, [token]);

  useEffect(() => {
    chat.getAdminChats().then((data) => {
      setChats(data);
      setLoading(false);
      if (!activeDisputeId && data.length > 0) setActiveDisputeId(data[0].dispute.id);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeDisputeId || !socket?.connected) return;
    socket.emit("join-dispute", activeDisputeId);
    chat.getDisputeChatroom(activeDisputeId).then((data) => {
      setMessages(data.messages);
      setDisputeInfo({ dispute_type: data.dispute_type, status: data.status, reason: data.reason });
    }).catch(() => toast.error("Failed to load messages"));

    const onMsg = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    const onTyping = (data: { userId: string; isTyping: boolean; senderName?: string }) => {
      setTypingUserId(data.isTyping ? data.userId : null);
      if (data.isTyping) setTypingName(data.senderName || "Someone");
    };
    const onOnline = (count: number) => setOnlineCount(count);
    socket.on("new-message", onMsg);
    socket.on("user-typing", onTyping);
    socket.on("online-users", onOnline);

    return () => {
      socket.emit("leave-dispute", activeDisputeId);
      socket.off("new-message", onMsg);
      socket.off("user-typing", onTyping);
      socket.off("online-users", onOnline);
    };
  }, [activeDisputeId, socket, connected]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { if (!showScrollBtn) scrollToBottom(false); }, [messages, showScrollBtn, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  const handleSend = () => {
    if (!input.trim() || !activeDisputeId || !socket) return;
    socket.emit("send-message", { disputeId: activeDisputeId, message: input.trim() });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSelectChat = (disputeId: string) => {
    setActiveDisputeId(disputeId);
    setSearchParams({ dispute: disputeId });
    setTypingUserId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (!activeDisputeId || !socket) return;
    socket.emit("typing", { disputeId: activeDisputeId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { disputeId: activeDisputeId, isTyping: false });
    }, 1500);
  };

  const activeChat = chats.find((c) => c.dispute.id === activeDisputeId);

  const filteredChats = chats.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      getTypeLabel(c.dispute.dispute_type).toLowerCase().includes(q) ||
      c.dispute.reason.toLowerCase().includes(q) ||
      c.dispute.id.slice(0, 8).includes(q)
    );
  });

  const isOwnMessage = (msg: ChatMessage) => msg.senderRole === "admin";

  const getAvatarLabel = (msg: ChatMessage) =>
    msg.senderRole === "admin" ? "A" : (msg.senderName || "U").slice(0, 2).toUpperCase();

  const getAvatarColor = (msg: ChatMessage) =>
    msg.senderRole === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderRole === "admin") return "Admin (You)";
    return msg.senderName || "User";
  };

  const shouldShowAvatar = (msgs: ChatMessage[], idx: number) => {
    if (idx === 0) return true;
    const prev = msgs[idx - 1];
    const curr = msgs[idx];
    return !isSameSender(prev, curr) || !isWithinTimeGroup(curr.createdAt, prev.createdAt);
  };

  const shouldShowDateSeparator = (msgs: ChatMessage[], idx: number) => {
    if (idx === 0) return true;
    return !isSameDay(msgs[idx].createdAt, msgs[idx - 1].createdAt);
  };

  const recentMsgPreview = (item: AdminChatItem) => {
    if (item.lastMessage) return item.lastMessage.message;
    return item.dispute.reason.slice(0, 80);
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="w-80 min-w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-gray-700" />
              <h2 className="font-semibold text-gray-900 text-sm">Dispute Chats</h2>
            </div>
            <button
              onClick={() => { setLoading(true); chat.getAdminChats().then(setChats).finally(() => setLoading(false)); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw size={15} className="text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-0 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={15} className="text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-yellow-400"}`} />
            <span className="text-[11px] text-gray-500">{connected ? "Live" : "Connecting..."}</span>
            <span className="text-[11px] text-gray-400 ml-auto">{chats.length} chat{chats.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-6">
              <MessageSquare size={28} className="mb-2" />
              <p className="text-sm font-medium">{searchQuery ? "No matches" : "No active chats"}</p>
            </div>
          ) : (
            filteredChats.map((c) => {
              const isActive = activeDisputeId === c.dispute.id;
              return (
                <button
                  key={c.dispute.id}
                  onClick={() => handleSelectChat(c.dispute.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition flex items-start gap-3 ${
                    isActive ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c.dispute.status === "Negotiating" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <MessageSquare size={16} className={c.dispute.status === "Negotiating" ? "text-blue-600" : "text-gray-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                        {getTypeLabel(c.dispute.dispute_type)}
                      </p>
                      {c.lastMessage && (
                        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(new Date(c.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {recentMsgPreview(c)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        c.dispute.status === "Negotiating" ? "bg-blue-100 text-blue-700" :
                        c.dispute.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {c.dispute.status}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-gray-300 mt-2 flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Select a dispute chat</p>
              <p className="text-xs text-gray-400 mt-1">Choose a conversation from the left panel</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {getTypeLabel(activeChat.dispute.dispute_type)}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {activeChat.dispute.reason}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onlineCount > 0 && (
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">· {onlineCount} online</span>
                )}
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                  activeChat.dispute.status === "Negotiating" ? "bg-blue-100 text-blue-700" :
                  activeChat.dispute.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {activeChat.dispute.status}
                </span>
              </div>
            </div>

            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-gray-50 relative">
              <div className="px-5 py-4 space-y-1">
                {messages.map((msg, idx) => (
                  <div key={msg.id}>
                    {shouldShowDateSeparator(messages, idx) && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {formatDate(new Date(msg.createdAt))}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-end gap-2 mb-0.5 ${isOwnMessage(msg) ? "flex-row-reverse" : ""} ${
                      !shouldShowAvatar(messages, idx) ? "mb-0.5" : "mt-3"
                    }`}>
                      {shouldShowAvatar(messages, idx) ? (
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg)} flex items-center justify-center flex-shrink-0 text-xs font-semibold`}>
                          {getAvatarLabel(msg)}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}
                      <div className={`max-w-[75%] ${isOwnMessage(msg) ? "items-end" : "items-start"} flex flex-col`}>
                        {shouldShowAvatar(messages, idx) && (
                          <span className={`text-[10px] font-medium mb-1 px-1 ${isOwnMessage(msg) ? "text-right w-full text-gray-400" : "text-gray-500"}`}>
                            {getSenderLabel(msg)}
                          </span>
                        )}
                        <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isOwnMessage(msg)
                            ? "bg-gray-900 text-white rounded-2xl rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"
                        }`}>
                          {msg.message}
                        </div>
                        <span className={`text-[10px] mt-0.5 px-1 ${isOwnMessage(msg) ? "text-right w-full text-gray-400" : "text-gray-400"}`}>
                          {formatTime(new Date(msg.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {typingUserId && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>

              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-4 right-4 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10"
                >
                  <ChevronDown size={18} className="text-gray-600" />
                </button>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none resize-none text-sm py-1.5 max-h-[120px] leading-relaxed"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
