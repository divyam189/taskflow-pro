import { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getSocket } from "../services/socket";

const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"];

const TasksPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ title: "", projectId: "", priority: "MEDIUM", status: "TODO" });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", projectId: "" });
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const load = useCallback(async () => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value)
    ).toString();
    const [taskRes, projectRes] = await Promise.all([api.get(`/tasks${query ? `?${query}` : ""}`), api.get("/projects")]);
    setTasks(taskRes.data.tasks);
    setProjects(projectRes.data.projects);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("task:created", load);
    socket.on("task:updated", load);
    socket.on("task:deleted", load);
    return () => {
      socket.off("task:created", load);
      socket.off("task:updated", load);
      socket.off("task:deleted", load);
    };
  }, [load]);

  const grouped = useMemo(
    () =>
      statuses.reduce((acc, s) => {
        acc[s] = tasks.filter((t) => t.status === s);
        return acc;
      }, {}),
    [tasks]
  );
  const paginatedTasks = useMemo(
    () => tasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [tasks, currentPage]
  );
  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage));

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks", form);
      toast.success("Task created");
      setForm({ title: "", projectId: "", priority: "MEDIUM", status: "TODO" });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    }
  };

  const onDragEnd = async ({ destination, draggableId }) => {
    if (!destination) return;
    const status = destination.droppableId;
    await api.put(`/tasks/${draggableId}`, { status });
    load();
  };

  const loadComments = async (taskId) => {
    setSelectedTaskId(taskId);
    const socket = getSocket();
    if (socket) socket.emit("join:task", taskId);
    const { data } = await api.get(`/comments/${taskId}`);
    setComments(data.comments);
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onCommentCreated = (comment) => {
      if (comment.taskId === selectedTaskId) setComments((prev) => [...prev, comment]);
    };
    socket.on("comment:created", onCommentCreated);
    return () => socket.off("comment:created", onCommentCreated);
  }, [selectedTaskId]);

  const addComment = async () => {
    if (!selectedTaskId || !commentText.trim()) return;
    await api.post(`/comments/${selectedTaskId}`, { content: commentText });
    setCommentText("");
  };

  return (
    <div className="space-y-6">
      {user?.role === "ADMIN" && (
        <form onSubmit={createTask} className={`grid gap-3 rounded-xl border p-4 md:grid-cols-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
          <input className={`rounded-lg border p-3 md:col-span-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} placeholder="Task title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <select className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} value={form.projectId} onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))} required>
            <option value="">Select project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button className="rounded-lg bg-indigo-600 p-3 font-semibold text-white">Create Task</button>
        </form>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`} placeholder="Search tasks" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
        <select className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
          <option value="">All status</option>
          <option value="TODO">Todo</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`} value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
          <option value="">All priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <select className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`} value={filters.projectId} onChange={(e) => setFilters((p) => ({ ...p, projectId: e.target.value }))}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statuses.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-60 rounded-xl border p-3 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
                  <h3 className="mb-3 font-semibold">{status.replace("_", " ")}</h3>
                  {grouped[status]?.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(draggableProvided) => (
                        <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps} className={`mb-2 rounded-lg p-3 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <button onClick={() => loadComments(task.id)} className="font-medium underline-offset-2 hover:underline">{task.title}</button>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>{task.project?.title}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <div className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
        <h3 className="mb-3 font-semibold">All Tasks (Paginated)</h3>
        <div className="space-y-2">
          {paginatedTasks.map((task) => (
            <div key={task.id} className={`rounded-lg p-3 text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <p className="font-medium">{task.title} - {task.status.replace("_", " ")}</p>
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>{task.project?.title}</p>
            </div>
          ))}
        </div>
        {tasks.length > itemsPerPage && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-slate-700 disabled:bg-slate-900" : "bg-slate-200 disabled:bg-slate-100"}`}>
              Prev
            </button>
            <span className="text-sm">Page {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-slate-700 disabled:bg-slate-900" : "bg-slate-200 disabled:bg-slate-100"}`}>
              Next
            </button>
          </div>
        )}
      </div>
      <div className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
        <h3 className="mb-3 font-semibold">Task Comments</h3>
        {!selectedTaskId ? (
          <p className={isDark ? "text-slate-400" : "text-slate-600"}>Click any task title to open comments.</p>
        ) : (
          <>
            <div className="mb-3 space-y-2">
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg p-2 text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <span className="font-semibold">{c.user.name}: </span>{c.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className={`flex-1 rounded-lg border p-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." />
              <button onClick={addComment} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
