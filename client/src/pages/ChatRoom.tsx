import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, Send, ChevronDown, Shield, User } from "lucide-react";
import { chat, type ChatMessage } from "../api/chat.api";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";

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

const getInitials = (name?: string) =>
  (name || "U").slice(0, 2).toUpperCase();

const TypingDots = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
      <User size={14} className="text-gray-500" />
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 transition-all duration-300">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const ChatRoom = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [typingName, setTypingName] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [disputeInfo, setDisputeInfo] = useState<{ dispute_type: string; status: string; reason: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    isConnected,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
    onOnlineUsers,
    onError,
  } = useSocket(disputeId);

  useEffect(() => {
    if (!disputeId) return;
    chat.getDisputeChatroom(disputeId).then((data) => {
      setMessages(data.messages);
      setDisputeInfo({ dispute_type: data.dispute_type, status: data.status, reason: data.reason });
      setLoading(false);
    }).catch(() => {
      navigate("/disputes");
    });
  }, [disputeId, navigate]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (!showScrollBtn) scrollToBottom(false);
  }, [messages, showScrollBtn, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(dist > 200);
  }, []);

  useEffect(() => {
    const unsubMsg = onNewMessage((msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    const unsubTyping = onUserTyping((data: { userId: string; isTyping: boolean; senderName?: string }) => {
      if (data.userId !== user?.id) {
        setTypingUserId(data.isTyping ? data.userId : null);
        if (data.isTyping) setTypingName(data.senderName || "Someone");
      }
    });
    const unsubOnline = onOnlineUsers((count: number) => setOnlineCount(count));
    console.log(onlineCount);
    
    const unsubError = onError((msg: string) => console.error("Socket error:", msg));
    return () => { unsubMsg?.(); unsubTyping?.(); unsubOnline?.(); unsubError?.(); };
  }, [onNewMessage, onUserTyping, onOnlineUsers, onError, user?.id]);

  useEffect(() => {
    if (!disputeId || !isConnected) return;
    sendTyping(disputeId, false);
  }, [isConnected, disputeId, sendTyping]);

  const handleSend = () => {
    if (!input.trim() || !disputeId) return;
    sendMessage(disputeId, input.trim());
    setInput("");
    sendTyping(disputeId, false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (!disputeId) return;
    sendTyping(disputeId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(disputeId, false), 1500);
  };

  const isOwnMessage = (msg: ChatMessage) => msg.senderId === user?.id;

  const getAvatarLabel = (msg: ChatMessage) => {
    if (msg.senderRole === "admin") return "A";
    return getInitials(msg.senderName);
  };

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderRole === "admin") return "Admin";
    if (isOwnMessage(msg)) return "You";
    return msg.senderName || "User";
  };

  const getAvatarColor = (msg: ChatMessage) => {
    if (msg.senderRole === "admin") return "bg-purple-100 text-purple-700";
    return "bg-blue-100 text-blue-700";
  };

  const shouldShowAvatar = (msgs: ChatMessage[], idx: number) => {
    if (idx === 0) return true;
    const prev = msgs[idx - 1];
    const curr = msgs[idx];
    if (!isSameSender(prev, curr)) return true;
    if (!isWithinTimeGroup(curr.createdAt, prev.createdAt)) return true;
    return false;
  };

  const shouldShowDateSeparator = (msgs: ChatMessage[], idx: number) => {
    if (idx === 0) return true;
    return !isSameDay(msgs[idx].createdAt, msgs[idx - 1].createdAt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <button onClick={() => navigate("/disputes")} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {disputeInfo ? getTypeLabel(disputeInfo.dispute_type) : "Dispute Chat"}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-400"}`} />
            <span className="text-[11px] text-gray-500">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
            {onlineCount > 0 && (
              <span className="text-[11px] text-gray-400">· {onlineCount} online</span>
            )}
          </div>
        </div>
        {disputeInfo && (
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${
            disputeInfo.status === "Negotiating" ? "bg-blue-100 text-blue-700" :
            disputeInfo.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
            "bg-green-100 text-green-700"
          }`}>
            {disputeInfo.status}
          </span>
        )}
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        {loading ? (
          <div className="flex flex-col gap-4 p-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-12 ${i % 2 === 0 ? "w-48" : "w-36"} bg-gray-200 rounded-2xl animate-pulse ${i % 2 === 0 ? "rounded-br-md" : "rounded-bl-md"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Shield size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs mt-1 text-center">Send a message to start the conversation with the admin and the other party.</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-1">
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
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg)} flex items-center justify-center shrink-0 text-xs font-semibold`}>
                      {getAvatarLabel(msg)}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}
                  <div className={`max-w-[75%] ${isOwnMessage(msg) ? "items-end" : "items-start"} flex flex-col`}>
                    {shouldShowAvatar(messages, idx) && (
                      <span className={`text-[10px] font-medium mb-1 px-1 ${isOwnMessage(msg) ? "text-right w-full text-gray-400" : "text-gray-500"}`}>
                        {getSenderLabel(msg)}
                      </span>
                    )}
                    <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-words ${
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
          </div>
        )}
        <div ref={messagesEndRef} />

        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition z-10"
          >
            <ChevronDown size={18} className="text-gray-600" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none resize-none text-sm py-1.5 max-h-30 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatRoom;
