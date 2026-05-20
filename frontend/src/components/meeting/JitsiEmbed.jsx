import { useAuth } from "../../context/AuthContext";

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || "meet.jit.si";

const JitsiEmbed = ({ roomSlug, onLeave }) => {
  const { user } = useAuth();
  const displayName = encodeURIComponent(user?.name || "Guest");
  const src = `https://${JITSI_DOMAIN}/${roomSlug}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;

  return (
    <div className="relative h-[min(70vh,600px)] w-full overflow-hidden rounded-xl border border-slate-700">
      <iframe
        title="Video meeting"
        src={src}
        allow="camera; microphone; fullscreen; display-capture"
        className="h-full w-full"
      />
      {onLeave && (
        <button
          type="button"
          onClick={onLeave}
          className="absolute right-3 top-3 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow"
        >
          Leave
        </button>
      )}
    </div>
  );
};

export default JitsiEmbed;
