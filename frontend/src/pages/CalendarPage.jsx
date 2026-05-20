import { useCallback, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { priorityColors } from "../utils/taskStyles";
import TaskDetailModal from "../components/calendar/TaskDetailModal";
import { Skeleton } from "../components/ui/Skeleton";

const CalendarPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ projectId: "", status: "", assignedTo: "" });
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dayGridMonth");

  const fetchRange = useCallback(
    async (start, end) => {
      setLoading(true);
      try {
        const params = {
          start: start.toISOString(),
          end: end.toISOString(),
          ...(filters.projectId ? { projectId: filters.projectId } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
        };
        const { data } = await api.get("/tasks/calendar", { params });
        setEvents(
          data.tasks
            .filter((t) => t.dueDate)
            .map((t) => ({
              id: t.id,
              title: t.title,
              start: t.dueDate,
              allDay: true,
              backgroundColor:
                t.priority === "HIGH" ? "#f43f5e" : t.priority === "LOW" ? "#10b981" : "#f59e0b",
              borderColor: "transparent",
              extendedProps: { task: t },
            }))
        );
      } catch {
        toast.error("Failed to load calendar tasks");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data.projects));
  }, []);

  useEffect(() => {
    const project = projects.find((p) => p.id === filters.projectId);
    if (project?.members) {
      setMembers(project.members.map((m) => m.user));
    } else {
      const all = projects.flatMap((p) => p.members?.map((m) => m.user) || []);
      setMembers([...new Map(all.map((u) => [u.id, u])).values()]);
    }
  }, [filters.projectId, projects]);

  const handleDatesSet = (info) => fetchRange(info.start, info.end);

  const handleEventDrop = async (info) => {
    const task = info.event.extendedProps.task;
    try {
      await api.put(`/tasks/${task.id}`, { dueDate: info.event.start.toISOString() });
      toast.success("Due date updated");
    } catch {
      info.revert();
      toast.error("Could not update due date");
    }
  };

  const inputClass = `rounded-lg border px-3 py-2 text-sm ${
    isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
  }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Task Calendar</h2>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Drag tasks to reschedule deadlines</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("dayGridMonth")}
            className={`rounded-lg px-3 py-2 text-sm ${view === "dayGridMonth" ? "bg-indigo-600 text-white" : isDark ? "bg-slate-800" : "bg-slate-200"}`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("timeGridWeek")}
            className={`rounded-lg px-3 py-2 text-sm ${view === "timeGridWeek" ? "bg-indigo-600 text-white" : isDark ? "bg-slate-800" : "bg-slate-200"}`}
          >
            Week
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className={inputClass} value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select className={inputClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className={inputClass} value={filters.assignedTo} onChange={(e) => setFilters((f) => ({ ...f, assignedTo: e.target.value }))}>
          <option value="">All members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(priorityColors).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`h-3 w-3 rounded ${v.bg}`} /> {k}
            </span>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${isDark ? "fc-dark border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
        {loading && <Skeleton className="mb-4 h-8 w-full" />}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          key={view + JSON.stringify(filters)}
          headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
          events={events}
          editable
          droppable
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          eventClick={(info) => setSelectedTask(info.event.extendedProps.task)}
          height="auto"
          aspectRatio={1.5}
        />
      </div>

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={() => navigate("/tasks")}
      />
    </div>
  );
};

export default CalendarPage;
