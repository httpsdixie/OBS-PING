/**
 * ActionQueueModal — shows only the tasks/stages that need the current user's action.
 * Opens from the "To Approve / To Review / Pending" badge on the dashboard.
 */
import { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import TaskDetail from "../tasks/TaskDetail";
import StatusBadge from "../ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useSimpleMode } from "../../context/SimpleModeContext";
import { stageStatusLabel, advanceActionLabel } from "../../constants/labels";
import { advanceStage, sendStageBack } from "../../services/taskService";

// Stage status badge styles
const STAGE_STYLES = {
  assigned:       "bg-blue-100 text-blue-700",
  acknowledged:   "bg-blue-100 text-blue-800",
  submitted:      "bg-yellow-100 text-yellow-800",
  checked:        "bg-purple-100 text-purple-800",
  needs_revision: "bg-red-100 text-red-700",
  approved:       "bg-green-100 text-green-700",
};

const renderLoadingContent = (text) => (
  <span className="flex items-center justify-center gap-1.5">
    <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    {text}
  </span>
);


export default function ActionQueueModal({ tasks, onTaskUpdated, onClose }) {
  const { user } = useAuth();
  const { simpleMode } = useSimpleMode();
  const [selectedTask, setSelectedTask]       = useState(null);
  const [busy, setBusy]                       = useState(null); // stage id being actioned
  const [revisionStageId, setRevisionStageId] = useState(null);
  const [revisionComment, setRevisionComment] = useState("");

  const role = user?.role;

  // Filter to only stages needing this user's action
  const actionItems = [];
  tasks.forEach((task) => {
    (task.stages ?? []).forEach((stage) => {
      const isMyStage = stage.assignee_id === user?.id;
      const needsMe =
        (isMyStage && ["assigned", "acknowledged", "needs_revision"].includes(stage.status)) ||
        (role === "admin" && stage.status === "submitted") ||
        (role === "super_admin" && stage.status === "checked");
      if (needsMe) actionItems.push({ task, stage });
    });
  });

  const handleAdvance = async (task, stage) => {
    setBusy(stage.id);
    try {
      const updated = await advanceStage(task.id, stage.id);
      toast.success("Done.");
      onTaskUpdated(updated);
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleSendBack = async () => {
    const item = actionItems.find((i) => i.stage.id === revisionStageId);
    if (!item) return;
    setBusy(revisionStageId);
    try {
      const updated = await sendStageBack(item.task.id, revisionStageId, revisionComment);
      toast.success("Sent back for revision.");
      onTaskUpdated(updated);
      setRevisionStageId(null);
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Failed.");
    } finally {
      setBusy(null);
    }
  };

  const canSendBack = (stage) =>
    (role === "admin" && stage.status === "submitted") ||
    (role === "super_admin" && stage.status === "checked");

  if (selectedTask) {
    return (
      <Modal title={selectedTask.title} onClose={() => setSelectedTask(null)}>
        <TaskDetail
          task={selectedTask}
          onUpdated={(updated) => { onTaskUpdated(updated); setSelectedTask(null); }}
          onDeleted={() => setSelectedTask(null)}
          onClose={() => setSelectedTask(null)}
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        simpleMode
          ? (role === "super_admin" ? "Needs your OK" :
             role === "admin"       ? "Ready for you to check" :
                                      "Your turn")
          : (role === "super_admin" ? "Stages to Approve" :
             role === "admin"       ? "Stages to Review" :
                                      "My Pending Stages")
      }
      onClose={onClose}
    >
      {actionItems.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Nothing needs your attention right now. 🎉</p>
      ) : (
        <div className="space-y-3">
          {actionItems.map(({ task, stage }) => {
            const actionRole = stage.assignee_id === user?.id ? "staff" : role;
            const advLabel = advanceActionLabel(`${stage.status}-${actionRole}`, simpleMode);
            const isBusy   = busy === stage.id;

            return (
              <div key={stage.id} className="card space-y-2">
                {/* Task info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      Due {format(new Date(task.deadline), "MMM d, yyyy")}
                      {task.category ? ` · ${task.category}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="text-xs text-maroon-700 hover:underline flex-shrink-0"
                  >
                    View full →
                  </button>
                </div>

                {/* Stage info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">
                    Stage {stage.order} — <span className="font-medium">{stage.label}</span>
                  </span>
                  <span className={`badge text-xs ${STAGE_STYLES[stage.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {stageStatusLabel(stage.status, simpleMode)}
                  </span>
                  {stage.assignee && (
                    <span className="text-xs text-gray-400">· {stage.assignee.name}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {advLabel && (
                    <button
                      className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center min-h-[32px]"
                      onClick={() => handleAdvance(task, stage)}
                      disabled={busy !== null}
                    >
                      {isBusy ? renderLoadingContent("Working...") : advLabel}
                    </button>
                  )}
                  {canSendBack(stage) && (
                    <button
                      className="btn-secondary text-xs py-1.5 px-3 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => { setRevisionComment(""); setRevisionStageId(stage.id); }}
                      disabled={busy !== null}
                    >
                      Send Back
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send-back comment modal */}
      {revisionStageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRevisionStageId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Send Back for Revision</h3>
            <p className="text-sm text-gray-500">Leave a comment for the assignee.</p>
            <textarea
              className="input" rows={4} autoFocus
              placeholder="e.g. Please revise the caption — it's too long."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                disabled={busy !== null}
                onClick={() => setRevisionStageId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger flex items-center justify-center min-w-[100px]"
                disabled={!revisionComment.trim() || busy !== null}
                onClick={handleSendBack}
              >
                {busy === revisionStageId ? renderLoadingContent("Sending...") : "Send Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
