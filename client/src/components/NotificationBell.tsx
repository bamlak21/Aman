import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  notificationApi,
  type NotificationItem,
} from "../api/notification.api";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

 

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await notificationApi.markAsRead(n.id);
      setNotifications((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, isRead: true } : p)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.dispute_id) {
      navigate(`/disputes/${n.dispute_id}/chat`);
    } else if (n.escrow_id) {
      navigate("/transactions");
    }
    setOpen(false);
  };

  

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = (dateStr: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -right-1.5 md:right-0 top-12 min-w-78 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-6 text-sm text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-2 items-start ${!n.isRead ? "bg-blue-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!n.isRead ? "font-semibold" : "text-gray-700"}`}
                    >
                      {n.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {timeAgo(n.createdAt)}
                      </span>
                      {n.escrow_id && (
                        <ExternalLink size={12} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
