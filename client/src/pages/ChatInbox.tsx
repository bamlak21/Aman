import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Send, MessageSquare, Shield, Search, ChevronDown,
  ChevronRight, User, ArrowLeft, X,
} from "lucide-react";
import { chat, type MyChatItem, type ChatMessage } from "../api/chat.api";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
import OfferPanel from "../components/OfferPanel";

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
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

const isSameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const isSameSender = (a: ChatMessage, b: ChatMessage) =>
  a.senderId === b.senderId && a.senderRole === b.senderRole;

const TIME_GROUP_THRESHOLD = 5 * 60 * 1000;
const isWithinTimeGroup = (a: string, b: string) =>
  new Date(a).getTime() - new Date(b).getTime() < TIME_GROUP_THRESHOLD;

const getInitials = (name?: string) =>name?.split(" ").map((n)=>n[0]).join("").slice(0, 2).toUpperCase()||"U";

const TypingDots = () => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
      <User size={12} className="text-gray-500" />
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const ChatInbox = () => {
  const { disputeId: paramDisputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [chats, setChats] = useState<MyChatItem[]>([]);
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(paramDisputeId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(!paramDisputeId);
  const [disputeInfo, setDisputeInfo] = useState<{ dispute_type: string; status: string; reason: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    isConnected, sendMessage, sendTyping,
    onNewMessage, onUserTyping, onOnlineUsers, onError,
  } = useSocket(activeDisputeId || undefined);

  useEffect(() => {
    chat.getMyChats().then((data) => {
      setChats(data);
      setLoading(false);
      if (!activeDisputeId && data.length > 0) {
        setActiveDisputeId(data[0].dispute.id);
      }
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeDisputeId) return;
    chat.getDisputeChatroom(activeDisputeId).then((data) => {
      setMessages(data.messages);
      setDisputeInfo({ dispute_type: data.dispute_type, status: data.status, reason: data.reason });
      setShowMobileList(false);
    }).catch(() => {});
  }, [activeDisputeId]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { if (!showScrollBtn) scrollToBottom(false); }, [messages, showScrollBtn, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }, []);

  useEffect(() => {
    const unsubMsg = onNewMessage((msg: ChatMessage) => setMessages((prev) => [...prev, msg]));
    const unsubTyping = onUserTyping((data: { userId: string; isTyping: boolean; senderName?: string }) => {
      if (data.userId !== user?.id) {
        setTypingUserId(data.isTyping ? data.userId : null);
      }
    });
    const unsubOnline = onOnlineUsers((count: number) => setOnlineCount(count));
    const unsubError = onError((msg: string) => console.error(msg));
    return () => { unsubMsg?.(); unsubTyping?.(); unsubOnline?.(); unsubError?.(); };
  }, [onNewMessage, onUserTyping, onOnlineUsers, onError, user?.id]);

  const handleSend = () => {
    if (!input.trim() || !activeDisputeId) return;
    sendMessage(activeDisputeId, input.trim());
    setInput("");
    sendTyping(activeDisputeId, false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSelectChat = (disputeId: string) => {
    setActiveDisputeId(disputeId);
    navigate(`/chat/${disputeId}`, { replace: true });
    setTypingUserId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (!activeDisputeId) return;
    sendTyping(activeDisputeId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(activeDisputeId, false), 1500);
  };

  const activeChat = chats.find((c) => c.dispute.id === activeDisputeId);
  const isResolved = disputeInfo?.status === "Resolved";
  const isReadOnly = isResolved;
  const filteredChats = chats.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      getTypeLabel(c.dispute.dispute_type).toLowerCase().includes(q) ||
      c.dispute.reason.toLowerCase().includes(q)
    );
  });

  const isOwnMessage = (msg: ChatMessage) => msg.senderId === user?.id;

  const getAvatarLabel = (msg: ChatMessage) =>
    msg.senderRole === "admin" ? "A" : getInitials(msg.senderName);

  const getAvatarColor = (msg: ChatMessage) =>
    msg.senderRole === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderRole === "admin") return "Admin";
    if (isOwnMessage(msg)) return "You";
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

  const recentMsgPreview = (item: MyChatItem) => {
    if (item.lastMessage) return item.lastMessage.message;
    return item.dispute.reason.slice(0, 80);
  };

  return (
    <div className="flex justify-center h-[calc(100vh-1.5rem)] border rounded-2xl border-gray-300 bg-gray-50 inset-shadow-sm inset-shadow-gray-300 mt-4 p-6 gap-5 m-1 md:ml-3">
      <div
        className={`${
          showMobileList || !activeDisputeId ? "flex" : "hidden"
        } md:flex  md:w-80 min-w-75 flex-col border shadow-md/30 shadow-gray-400 border-gray-200 bg-white rounded-3xl`}
      >
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">My Chats</h2>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-0 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X size={15} className="text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-400"}`}
            />
            <span className="text-[11px] text-gray-500">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
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
              <p className="text-sm font-medium">
                {searchQuery ? "No matches" : "No active chats"}
              </p>
              <p className="text-xs mt-1 text-center">
                Start a dispute to begin chatting with an admin.
              </p>
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      c.dispute.status === "Negotiating"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      className={
                        c.dispute.status === "Negotiating"
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium truncate ${isActive ? "text-blue-900" : "text-gray-900"}`}
                      >
                        {getTypeLabel(c.dispute.dispute_type)}
                      </p>
                      {c.lastMessage && (
                        <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                          {formatTime(new Date(c.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {recentMsgPreview(c)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full mt-1.5 ${
                        c.dispute.status === "Negotiating"
                          ? "bg-blue-100 text-blue-700"
                          : c.dispute.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {c.dispute.status}
                    </span>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-gray-300 mt-2 shrink-0"
                  />
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`${
          !showMobileList || !activeDisputeId ? "flex" : "hidden"
        } md:flex flex-1 flex-col min-w-75`}
      >
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No chat selected
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Choose a conversation from the list
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 md:px-4 px-1 justify-center bg-white py-3 border border-gray-200 rounded-2xl shadow-sm/30 shadow-gray-400">
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {disputeInfo
                    ? getTypeLabel(disputeInfo.dispute_type)
                    : "Dispute Chat"}
                </h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {disputeInfo?.reason || ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onlineCount > 0 && (
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    · {onlineCount} online
                  </span>
                )}
                <span
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${
                    disputeInfo?.status === "Negotiating"
                      ? "bg-blue-100 text-blue-700"
                      : disputeInfo?.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {disputeInfo?.status || ""}
                </span>
              </div>
            </div>

            {activeDisputeId && user?.id && (
              <div className="mt-2">
                <OfferPanel disputeId={activeDisputeId} userId={user.id} />
              </div>
            )}

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto rounded-2xl bg-gray-50 mt-2 relative"
            >
              <div className="px-2 py-4 space-y-1">
                {messages.map((msg, idx) => (
                  <div key={msg.id}>
                    {shouldShowDateSeparator(messages, idx) && (
                      <div className="flex justify-center my-4">
                        <span className="text-[11px] font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {formatDate(new Date(msg.createdAt))}
                        </span>
                      </div>
                    )}
                    {msg.senderRole === "system" ? (
                      <div className="flex justify-center my-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white border border-blue-200 px-3.5 py-1.5 rounded-full shadow-sm">
                          <Shield size={12} className="text-blue-500" />
                          {msg.message}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-end gap-2 mb-0.5 ${isOwnMessage(msg) ? "flex-row-reverse" : ""} ${
                          !shouldShowAvatar(messages, idx) ? "mb-0.5" : "mt-3"
                        }`}
                      >
                        {shouldShowAvatar(messages, idx) ? (
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(msg)} flex items-center justify-center shrink-0 text-xs font-semibold`}
                          >
                            {getAvatarLabel(msg)}
                          </div>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}
                        <div
                          className={`max-w-[75%] ${isOwnMessage(msg) ? "items-end" : "items-start"} flex flex-col`}
                        >
                          {shouldShowAvatar(messages, idx) && (
                            <span
                              className={`text-[10px] font-medium mb-1 px-1 ${isOwnMessage(msg) ? "text-right w-full text-gray-400" : "text-gray-500"}`}
                            >
                              {getSenderLabel(msg)}
                            </span>
                          )}
                          <div
                            className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break ${
                              isOwnMessage(msg)
                                ? "bg-gray-900 text-white rounded-2xl rounded-br-sm"
                                : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span
                            className={`text-[10px] mt-0.5 px-1 ${isOwnMessage(msg) ? "text-right w-full text-gray-400" : "text-gray-400"}`}
                          >
                            {formatTime(new Date(msg.createdAt))}
                          </span>
                        </div>
                      </div>
                    )}
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

            <div className="px-5 py-3 border-gray-200 bg-gray-50">
              {isReadOnly ? (
                <div className="text-center py-3 px-4 bg-gray-100 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium">
                    Dispute Resolved
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    This conversation is read-only
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex border inset-shadow-xs inset-shadow-gray-200 border-gray-50 items-end gap-2 bg-white shadow-xl rounded-2xl px-4 py-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none resize-none text-sm py-1.5 max-h-30 leading-relaxed disabled:text-gray-400 disabled:cursor-not-allowed"
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
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInbox;
