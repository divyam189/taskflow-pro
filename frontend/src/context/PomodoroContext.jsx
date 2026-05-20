import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

const PomodoroContext = createContext(null);

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export const PomodoroProvider = ({ children }) => {
  const [mode, setMode] = useState("WORK");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState(null);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/focus/stats");
      setStats(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const completeSession = useCallback(async () => {
    const durationMinutes = mode === "WORK" ? 25 : 5;
    try {
      await api.post("/focus/sessions", {
        taskId: linkedTaskId,
        type: mode,
        durationMinutes,
      });
      await loadStats();
    } catch {
      toast.error("Could not save focus session");
    }

    if (mode === "WORK") {
      toast.success("Pomodoro complete! Take a break.");
      setMode("BREAK");
      setSecondsLeft(BREAK_SECONDS);
    } else {
      toast.success("Break over. Ready to focus?");
      setMode("WORK");
      setSecondsLeft(WORK_SECONDS);
    }
    setRunning(false);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      /* audio optional */
    }
  }, [mode, linkedTaskId, loadStats]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, completeSession]);

  const totalSeconds = mode === "WORK" ? WORK_SECONDS : BREAK_SECONDS;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSecondsLeft(mode === "WORK" ? WORK_SECONDS : BREAK_SECONDS);
  };

  const value = useMemo(
    () => ({
      mode,
      secondsLeft,
      running,
      progress,
      linkedTaskId,
      setLinkedTaskId,
      stats,
      start,
      pause,
      reset,
      formatTime: () => {
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      },
    }),
    [mode, secondsLeft, running, progress, linkedTaskId, stats]
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
};

export const usePomodoro = () => useContext(PomodoroContext);
