import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const initialForm = { title: "", description: "", status: "PLANNING", dueDate: "" };

const ProjectsPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const load = useCallback(() => {
    api.get(`/projects?search=${encodeURIComponent(search)}`).then(({ data }) => setProjects(data.projects));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      api
        .get("/users")
        .then(({ data }) => setUsers(data.users))
        .catch(() => setUsers([]));
    }
  }, [user?.role]);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects", { ...form, memberIds: selectedMembers });
      toast.success("Project created");
      setForm(initialForm);
      setSelectedMembers([]);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project");
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete project?")) return;
    await api.delete(`/projects/${id}`);
    toast.success("Project deleted");
    load();
  };

  const updateMembers = async (id, members) => {
    await api.put(`/projects/${id}`, { memberIds: members });
    toast.success("Members updated");
    load();
  };

  const paginatedProjects = projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(projects.length / itemsPerPage));

  return (
    <div className="space-y-6">
      {user?.role === "ADMIN" && (
        <form onSubmit={createProject} className={`grid gap-3 rounded-xl border p-4 md:grid-cols-2 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
          <input className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} placeholder="Project title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} placeholder="Due date" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
          <textarea className={`rounded-lg border p-3 md:col-span-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <div className={`rounded-lg border p-3 md:col-span-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`}>
            <p className="mb-2 text-sm font-semibold">Assign team members</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {users.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) =>
                      setSelectedMembers((prev) =>
                        e.target.checked ? [...prev, member.id] : prev.filter((id) => id !== member.id)
                      )
                    }
                  />
                  <span>{member.name} ({member.role})</span>
                </label>
              ))}
            </div>
          </div>
          <button className="rounded-lg bg-indigo-600 p-3 font-semibold text-white hover:bg-indigo-500 md:col-span-2">Create Project</button>
        </form>
      )}

      <input className={`w-full rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`} placeholder="Search projects..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 ? (
          <p className={isDark ? "text-slate-400" : "text-slate-600"}>No projects found.</p>
        ) : (
          paginatedProjects.map((project) => (
            <div key={project.id} className={`rounded-xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white"}`}>
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{project.description}</p>
              <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>Status: {project.status} | Tasks: {project.tasks.length}</p>
              {user?.role === "ADMIN" && (
                <select
                  multiple
                  className={`mt-3 w-full rounded-lg border p-2 text-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-slate-50"}`}
                  defaultValue={project.members.map((m) => m.userId)}
                  onChange={(e) => updateMembers(project.id, Array.from(e.target.selectedOptions).map((o) => o.value))}
                >
                  {users.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              )}
              {user?.role === "ADMIN" && (
                <button className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm text-white" onClick={() => deleteProject(project.id)}>
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {projects.length > itemsPerPage && (
        <div className="flex items-center justify-end gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-slate-800 disabled:bg-slate-900" : "bg-slate-200 disabled:bg-slate-100"}`}>
            Prev
          </button>
          <span className="text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className={`rounded-lg px-3 py-2 text-sm ${isDark ? "bg-slate-800 disabled:bg-slate-900" : "bg-slate-200 disabled:bg-slate-100"}`}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
