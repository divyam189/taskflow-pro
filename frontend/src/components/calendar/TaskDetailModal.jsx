import { priorityColors, statusLabels } from "../../utils/taskStyles";
import { useTheme } from "../../context/ThemeContext";

const TaskDetailModal = ({ task, onClose, onUpdated }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  if (!task) return null;

  const colors = priorityColors[task.priority] || priorityColors.MEDIUM;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-xl font-bold">{task.title}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            ✕
          </button>
        </div>
        <p className={`mb-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{task.description || "No description"}</p>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Status:</span> {statusLabels[task.status]}
          </p>
          <p>
            <span className="font-semibold">Priority:</span>{" "}
            <span className={`inline-block rounded px-2 py-0.5 text-xs text-white ${colors.bg}`}>{task.priority}</span>
          </p>
          <p>
            <span className="font-semibold">Project:</span> {task.project?.title}
          </p>
          <p>
            <span className="font-semibold">Assignee:</span> {task.assignee?.name || "Unassigned"}
          </p>
          <p>
            <span className="font-semibold">Due:</span>{" "}
            {task.dueDate ? new Date(task.dueDate).toLocaleString() : "—"}
          </p>
        </div>
        {onUpdated && (
          <button
            type="button"
            onClick={() => onUpdated(task)}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white"
          >
            Open in Tasks
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
