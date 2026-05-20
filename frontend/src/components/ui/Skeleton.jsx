import { useTheme } from "../../context/ThemeContext";

export const Skeleton = ({ className = "" }) => {
  const { theme } = useTheme();
  const base = theme === "dark" ? "bg-slate-800" : "bg-slate-200";
  return <div className={`animate-pulse rounded-lg ${base} ${className}`} />;
};

export const CardSkeleton = () => (
  <div className="space-y-3 rounded-xl border border-slate-800 p-4">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
  </div>
);
