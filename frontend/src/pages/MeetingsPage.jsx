import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import JitsiEmbed from "../components/meeting/JitsiEmbed";
import { Skeleton } from "../components/ui/Skeleton";

const MeetingsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const card = isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-white";
  const input = `w-full rounded-lg border px-3 py-2 text-sm ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`;

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setProjects(data.projects);
      if (data.projects[0]) setProjectId(data.projects[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/meetings/project/${projectId}`).then(({ data }) => setMeetings(data.meetings));
  }, [projectId]);

  const startMeeting = async () => {
    if (!projectId) return toast.error("Select a project");
    try {
      const { data } = await api.post("/meetings", { projectId, title: title || undefined });
      setMeetings((prev) => [data.meeting, ...prev]);
      setActiveRoom(data.meeting.roomSlug);
      setTitle("");
      toast.success("Meeting started");
    } catch {
      toast.error("Could not start meeting");
    }
  };

  const copyLink = (slug) => {
    const url = `https://${import.meta.env.VITE_JITSI_DOMAIN || "meet.jit.si"}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Video Meetings</h2>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>Jitsi-powered project syncs</p>
      </div>

      <div className={`grid gap-6 lg:grid-cols-[320px_1fr]`}>
        <div className={`space-y-4 rounded-2xl border p-4 ${card}`}>
          <label className="text-sm font-medium">Project workspace</label>
          <select className={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input className={input} placeholder="Meeting title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button type="button" onClick={startMeeting} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white">
            Start meeting
          </button>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">History</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {meetings.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-slate-500">{new Date(m.startedAt).toLocaleString()}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => setActiveRoom(m.roomSlug)} className="text-xs text-indigo-400 hover:underline">
                      Join
                    </button>
                    <button type="button" onClick={() => copyLink(m.roomSlug)} className="text-xs text-slate-400 hover:underline">
                      Copy link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${card}`}>
          {activeRoom ? (
            <JitsiEmbed roomSlug={activeRoom} onLeave={() => setActiveRoom(null)} />
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-500">Start or join a meeting to begin</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingsPage;
