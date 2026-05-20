import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";
import PomodoroWidget from "../components/pomodoro/PomodoroWidget";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/tasks", label: "Tasks" },
  { to: "/chat", label: "Chat" },
  { to: "/calendar", label: "Calendar" },
  { to: "/analytics", label: "Analytics" },
  { to: "/meetings", label: "Meetings" },
];

const AppLayout = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    const { data } = await api.get("/notifications");
    setNotifications(data.notifications);
  };

  useEffect(() => {
    loadNotifications();
    const socket = getSocket();
    if (!socket) return;
    const onNotification = (payload) => {
      setNotifications((prev) => [{ id: `temp-${Date.now()}`, ...payload, read: false, createdAt: new Date().toISOString() }, ...prev]);
      toast.success(payload.title);
    };
    socket.on("notification:new", onNotification);
    return () => socket.off("notification:new", onNotification);
  }, []);

  const markRead = async (id) => {
    if (id.startsWith("temp-")) return;
    await api.put(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className={`border-r p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto ${isDark ? "border-slate-800" : "border-slate-300 bg-white"}`}>
          <h1 className="mb-6 text-xl font-bold">TaskFlow Pro</h1>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                className={`block rounded-lg px-3 py-2 text-sm ${pathname === link.to ? "bg-indigo-600 text-white" : isDark ? "hover:bg-slate-800" : "hover:bg-slate-200"}`}
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>
          <header className={`flex items-center justify-between border-b p-4 ${isDark ? "border-slate-800" : "border-slate-300 bg-white"}`}>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{user?.role}</p>
            </div>
            <div className="flex gap-2">
              <div className={`relative rounded-lg px-3 py-2 text-sm ${isDark ? "bg-slate-700" : "bg-slate-200"}`} title="Notifications">
                Notifications ({unreadCount})
              </div>
              <button onClick={toggleTheme} className={`rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-200 hover:bg-slate-300"}`}>
                {isDark ? "Light" : "Dark"} Mode
              </button>
              <button onClick={logout} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500">
                Logout
              </button>
            </div>
          </header>
          <div className="p-4 md:p-6">
            {notifications.length > 0 && (
              <div className={`mb-4 rounded-xl border p-3 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
                <p className="mb-2 text-sm font-semibold">Recent notifications</p>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((item) => (
                    <button key={item.id} onClick={() => markRead(item.id)} className={`flex w-full items-start justify-between rounded-lg p-2 text-left text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <span>{item.title}: {item.message}</span>
                      {!item.read && <span className="ml-2 text-xs text-indigo-400">new</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Outlet />
          </div>
          <PomodoroWidget />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
