import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isMine = message.userId === user?.id;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMine
            ? "rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
            : isDark
              ? "rounded-bl-md bg-slate-800 text-slate-100"
              : "rounded-bl-md bg-slate-200 text-slate-900"
        }`}
      >
        {!isMine && <p className="mb-1 text-xs font-semibold text-indigo-400">{message.user?.name}</p>}
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] ${isMine ? "text-indigo-200" : isDark ? "text-slate-500" : "text-slate-500"}`}>
          {time}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
