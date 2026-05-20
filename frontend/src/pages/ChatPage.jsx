import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "../components/chat/MessageBubble";
import TypingIndicator from "../components/chat/TypingIndicator";
import { Skeleton } from "../components/ui/Skeleton";

const ChatPage = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const [rooms, setRooms] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const card = isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white";

  const loadRooms = useCallback(async () => {
    const { data } = await api.get("/chat/rooms");
    setRooms(data.rooms);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const selectProject = async (roomItem) => {
    setActiveProject(roomItem);
    const { data } = await api.get(`/chat/${roomItem.project.id}/messages`);
    setMessages(data.messages);
    setRooms((prev) =>
      prev.map((r) => (r.project.id === roomItem.project.id ? { ...r, unread: 0 } : r))
    );
    const socket = getSocket();
    if (socket) {
      socket.emit("chat:join", roomItem.project.id);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeProject) return undefined;

    const onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.userId !== user?.id) {
        setRooms((prev) =>
          prev.map((r) =>
            r.project.id === msg.projectId ? { ...r, unread: (r.unread || 0) + 1 } : r
          )
        );
      }
    };

    const onTyping = ({ projectId, userId, userName, isTyping }) => {
      if (projectId !== activeProject.project.id || userId === user?.id) return;
      setTypingUsers((prev) => {
        if (isTyping) return [...new Set([...prev, userName])];
        return prev.filter((n) => n !== userName);
      });
    };

    const onPresence = (payload) => {
      if (payload.onlineUserIds) setOnlineIds(payload.onlineUserIds);
      else if ("userId" in payload) {
        setOnlineIds((prev) =>
          payload.online ? [...new Set([...prev, payload.userId])] : prev.filter((id) => id !== payload.userId)
        );
      }
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    socket.on("presence:list", onPresence);
    socket.on("presence:update", onPresence);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("presence:list", onPresence);
      socket.off("presence:update", onPresence);
      socket.emit("chat:leave", activeProject.project.id);
    };
  }, [activeProject, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket || !activeProject) return;
    socket.emit("chat:typing", { projectId: activeProject.project.id, isTyping });
  };

  const handleInput = (value) => {
    setText(value);
    emitTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), 1200);
  };

  const sendMessage = () => {
    if (!text.trim() || !activeProject) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("chat:send", { projectId: activeProject.project.id, content: text.trim() });
    }
    setText("");
    emitTyping(false);
    setShowEmoji(false);
  };

  if (loading) {
    return (
      <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <Skeleton className="h-full" />
        <Skeleton className="h-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Team Chat</h2>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Project rooms with realtime messaging</p>
      </div>
      <div className={`grid h-[70vh] overflow-hidden rounded-2xl border ${card} md:grid-cols-[280px_1fr]`}>
        <aside className={`overflow-y-auto border-r p-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</p>
          {rooms.map((item) => (
            <button
              key={item.project.id}
              type="button"
              onClick={() => selectProject(item)}
              className={`mb-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                activeProject?.project.id === item.project.id
                  ? "bg-indigo-600 text-white"
                  : isDark
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
              }`}
            >
              <span>
                <span className="block font-medium">{item.project.title}</span>
                {item.lastMessage && (
                  <span className="mt-1 block truncate text-xs opacity-70">{item.lastMessage.content}</span>
                )}
              </span>
              {item.unread > 0 && (
                <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                  {item.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        <section className="flex flex-col">
          {activeProject ? (
            <>
              <header className={`border-b px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <p className="font-semibold">{activeProject.project.title}</p>
                <p className="text-xs text-slate-500">
                  {activeProject.project.members?.length || 0}+ members · {onlineIds.length} online
                </p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                <TypingIndicator users={typingUsers} />
                <div ref={bottomRef} />
              </div>
              <footer className={`relative border-t p-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                {showEmoji && (
                  <div className="absolute bottom-full left-3 z-10 mb-2">
                    <EmojiPicker
                      theme={isDark ? "dark" : "light"}
                      onEmojiClick={(e) => setText((t) => t + e.emoji)}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className={`rounded-lg px-3 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                  >
                    😀
                  </button>
                  <input
                    value={text}
                    onChange={(e) => handleInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Message your team..."
                    className={`flex-1 rounded-xl border px-4 py-2 text-sm outline-none focus:border-indigo-500 ${
                      isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Send
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-500">Select a project to start chatting</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
