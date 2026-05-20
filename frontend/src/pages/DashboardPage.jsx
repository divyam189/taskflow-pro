import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const DashboardPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api.get("/projects/analytics/overview").then(({ data }) => {
      setMetrics(data.metrics);
      setActivities(data.recentActivity);
    });
  }, []);

  if (!metrics) return <p className="text-slate-300">Loading dashboard...</p>;

  const cards = [
    { label: "Total Projects", value: metrics.totalProjects },
    { label: "Total Tasks", value: metrics.totalTasks },
    { label: "Completed Tasks", value: metrics.completedTasks },
    { label: "Pending Tasks", value: metrics.pendingTasks },
    { label: "Overdue Tasks", value: metrics.overdueTasks },
  ];

  const chartData = [
    { name: "Completed", value: metrics.completedTasks },
    { name: "Pending", value: metrics.pendingTasks },
    { name: "Overdue", value: metrics.overdueTasks },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`h-72 rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
          <h3 className="mb-3 text-lg font-semibold">Task Snapshot</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#cbd5e1"} />
              <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#475569"} />
              <YAxis stroke={isDark ? "#94a3b8" : "#475569"} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
          <h3 className="mb-3 text-lg font-semibold">Recent Activity</h3>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>No activity yet.</p>
            ) : (
              activities.map((item) => (
                <div key={item.id} className={`rounded-lg p-3 text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <span className="font-semibold">{item.user.name}</span> {item.action}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
