const TypingIndicator = ({ users = [] }) => {
  if (!users.length) return null;
  const label = users.length === 1 ? `${users[0]} is typing` : `${users.join(", ")} are typing`;
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-slate-400">
      <span>{label}</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
      </span>
    </div>
  );
};

export default TypingIndicator;
