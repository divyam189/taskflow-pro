import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { CardSkeleton } from "../components/ui/Skeleton";
import { getSocket } from "../services/socket";

const COLORS = ["#6366f1", "#22c55e", "#f43f5e", "#f59e0b", "#06b6d4"];

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [data, setData] = useState(null);
  const card = isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white";

  const load = () => api.get("/analytics/advanced").then(({ data: d }) => setData(d));

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on("task:created", refresh);
    socket.on("task:updated", refresh);
    socket.on("task:deleted", refresh);
    return () => {
      socket.off("task:created", refresh);
      socket.off("task:updated", refresh);
      socket.off("task:deleted", refresh);
    };
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { summary, teamProductivity, mostActiveMember, projectProgress, priorityDistribution, weeklyCompletion, statusBreakdown } =
    data;

  const kpi = [
    { label: "Completion Rate", value: `${summary.completionRate}%` },
    { label: "Completed", value: summary.completedTasks },
    { label: "Pending", value: summary.pendingTasks },
    { label: "Overdue", value: summary.overdueTasks },
    { label: "Most Active", value: mostActiveMember?.name || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Productivity Analytics
        </h2>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Real-time team insights</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {kpi.map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${card}`}>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`h-80 rounded-xl border p-4 ${card}`}>
          <h3 className="mb-2 font-semibold">Weekly Completions</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={weeklyCompletion}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="label" stroke={isDark ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`h-80 rounded-xl border p-4 ${card}`}>
          <h3 className="mb-2 font-semibold">Task Status</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {statusBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={`h-80 rounded-xl border p-4 ${card}`}>
          <h3 className="mb-2 font-semibold">Team Productivity</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={teamProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#8b5cf6" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`h-80 rounded-xl border p-4 ${card}`}>
          <h3 className="mb-2 font-semibold">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="priority" stroke={isDark ? "#94a3b8" : "#64748b"} />
              <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${card}`}>
        <h3 className="mb-4 font-semibold">Project Progress</h3>
        <div className="space-y-4">
          {projectProgress.map((p) => (
            <div key={p.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{p.title}</span>
                <span className="text-indigo-400">{p.percent}%</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${p.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
