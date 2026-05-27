/**
 * TaskCard — single task row/card used in both List and Timeline views.
 * Shows stage progress instead of a single assignee.
 */
import { format, isPast } from "date-fns";
import StatusBadge from "../ui/StatusBadge";

export default function TaskCard({ task, onClick }) {
  const isOverdue = isPast(new Date(task.deadline)) && task.status !== "published";
  const stages = task.stages ?? [];

  // Find the currently active stage (first non-pending, non-approved)
  const activeStage = stages.find(
    (s) => !["pending", "approved"].includes(s.status)
  );
  const approvedCount = stages.filter((s) => s.status === "approved").length;

  return (
    <button
      onClick={() => onClick(task)}
      className="card w-full text-left hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-maroon-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{task.title}</p>

          {/* Stage progress line */}
          {stages.length > 0 ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {activeStage
                ? `Stage ${activeStage.order}/${stages.length} — ${activeStage.label}`
                : task.status === "published"
                  ? `All ${stages.length} stage${stages.length !== 1 ? "s" : ""} complete`
                  : `${approvedCount}/${stages.length} stages approved`}
              {activeStage?.assignee && (
                <span className="text-gray-400"> · {activeStage.assignee.name}</span>
              )}
            </p>
          ) : null}

          {task.category && (
            <p className="text-xs text-gray-400">{task.category}</p>
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Stage progress dots */}
      {stages.length > 1 && (
        <div className="flex items-center gap-1 mt-2">
          {stages.map((s) => (
            <span
              key={s.id}
              title={`Stage ${s.order}: ${s.label} — ${s.status}`}
              className={`inline-block w-2 h-2 rounded-full
                ${s.status === "approved"       ? "bg-green-500" :
                  s.status === "pending"        ? "bg-gray-300" :
                  s.status === "needs_revision" ? "bg-red-400" :
                                                  "bg-maroon-600"}`}
            />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
          Due: {format(new Date(task.deadline), "MMM d, yyyy")}
          {isOverdue && " — OVERDUE"}
        </span>
        {task.event_tag && (
          <span className="badge bg-maroon-50 text-maroon-700">{task.event_tag}</span>
        )}
      </div>
    </button>
  );
}
