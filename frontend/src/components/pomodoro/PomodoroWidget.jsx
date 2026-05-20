import { useState } from "react";
import { usePomodoro } from "../../context/PomodoroContext";
import { useTheme } from "../../context/ThemeContext";

const PomodoroWidget = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const { mode, running, progress, start, pause, reset, formatTime, stats } = usePomodoro();

  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105"
        title="Pomodoro Timer"
      >
        {formatTime().slice(0, 2)}
      </button>

      {open && (
        <div
          className={`fixed bottom-24 right-6 z-50 w-72 rounded-2xl border p-4 shadow-2xl ${
            isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{mode === "WORK" ? "Focus" : "Break"}</p>
            <button type="button" onClick={() => setOpen(false)} className="text-sm opacity-60 hover:opacity-100">
              Close
            </button>
          </div>
          <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
            <svg className="-rotate-90" width="112" height="112">
              <circle cx="56" cy="56" r={r} fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="8" />
              <circle
                cx="56"
                cy="56"
                r={r}
                fill="none"
                stroke={mode === "WORK" ? "#6366f1" : "#22c55e"}
                strokeWidth="8"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute text-2xl font-bold tabular-nums">{formatTime()}</span>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button type="button" onClick={start} className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white">
                Start
              </button>
            ) : (
              <button type="button" onClick={pause} className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white">
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
            >
              Reset
            </button>
          </div>
          {stats && (
            <p className={`mt-3 text-center text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Today: {stats.todayMinutes} min · {stats.todayPomodoros} sessions
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default PomodoroWidget;
