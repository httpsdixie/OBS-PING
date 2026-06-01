/**
 * TaskDetail — full task view with multi-stage timeline and workflow actions.
 *
 * Stage timeline:
 *   - Approved stages show a green checkmark
 *   - Pending stages show a lock icon
 *   - Active stage shows action buttons for the relevant actor
 */
import { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import StatusBadge from "../ui/StatusBadge";
import ConfirmDialog from "../ui/ConfirmDialog";
import TaskForm from "./TaskForm";
import {
  advanceStage,
  sendStageBack,
  pokeStage,
  deleteTask,
  archiveTask,
  unarchiveTask,
  updateTask,
} from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";
import { useSimpleMode } from "../../context/SimpleModeContext";
import { stageStatusLabel, advanceActionLabel } from "../../constants/labels";
import {
  PencilIcon,
  LockClosedIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Stage status → badge style
const STAGE_STATUS_STYLES = {
  pending:        "bg-gray-100 text-gray-500",
  assigned:       "bg-blue-100 text-blue-700",
  acknowledged:   "bg-blue-100 text-blue-800",
  submitted:      "bg-yellow-100 text-yellow-800",
  checked:        "bg-purple-100 text-purple-800",
  needs_revision: "bg-red-100 text-red-700",
  approved:       "bg-green-100 text-green-700",
};

function StageBadge({ status, simpleMode }) {
  return (
    <span className={`badge text-xs ${STAGE_STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {stageStatusLabel(status, simpleMode)}
    </span>
  );
}

const renderLoadingContent = (text) => (
  <span className="flex items-center justify-center gap-1.5">
    <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    {text}
  </span>
);


function StageTimeline({ task, currentUser, onUpdated, viewingArchived }) {
  const { isSuperAdmin, canPoke } = useAuth();
  const { simpleMode } = useSimpleMode();
  const [busy, setBusy] = useState(null); // { type, stageId } or null
  const [revisionStageId, setRevisionStageId] = useState(null);
  const [revisionComment, setRevisionComment] = useState("");

  const role = currentUser?.role;
  const stages = task.stages ?? [];

  const run = async (type, stageId, fn, successMsg) => {
    setBusy({ type, stageId });
    try {
      const updated = await fn();
      toast.success(successMsg);
      onUpdated(updated);
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleAdvance = (stageId) =>
    run("advance", stageId, () => advanceStage(task.id, stageId), "Stage advanced.");

  const handleSendBack = async () => {
    setBusy({ type: "send_back", stageId: revisionStageId });
    try {
      const updated = await sendStageBack(task.id, revisionStageId, revisionComment);
      toast.success("Sent back for revision.");
      onUpdated(updated);
      setRevisionStageId(null);
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Failed.");
    } finally {
      setBusy(null);
    }
  };

  const handlePoke = async (stageId) => {
    setBusy({ type: "poke", stageId });
    try {
      await pokeStage(task.id, stageId);
      toast.success("Reminder sent.");
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Failed to send reminder.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {simpleMode ? "Who does what" : "Stages"}
      </p>

      <ol className="relative border-l-2 border-gray-200 ml-3 space-y-4">
        {stages.map((stage, idx) => {
          const isApproved = stage.status === "approved";
          const isPending  = stage.status === "pending";
          const isActive   = !isApproved && !isPending;

          // Who can act on this stage?
          const isMyStage   = stage.assignee_id === currentUser?.id;
          const staffCanAct = isMyStage && isActive &&
            ["assigned", "acknowledged", "needs_revision"].includes(stage.status);
          const adminCanAct = (role === "admin" || role === "super_admin") &&
            stage.status === "submitted";
          const eicCanAct   = role === "super_admin" && stage.status === "checked";
          const canSendBack = !viewingArchived && (
            (role === "admin" && stage.status === "submitted") ||
            (role === "super_admin" && stage.status === "checked")
          );
          const canPokeStage = canPoke && isActive && !viewingArchived;

          const actionRole = isMyStage ? "staff" : role;
          const advanceLabel = advanceActionLabel(`${stage.status}-${actionRole}`, simpleMode);

          return (
            <li key={stage.id} className="ml-4 pb-1">
              {/* Timeline dot */}
              <span className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-white
                ${isApproved ? "bg-green-500" : isPending ? "bg-gray-300" : "bg-maroon-700"}`}
              >
                {isApproved ? (
                  <CheckCircleSolid className="w-3.5 h-3.5 text-white" />
                ) : isPending ? (
                  <LockClosedIcon className="w-3 h-3 text-white" />
                ) : (
                  <span className="text-white text-[10px] font-bold">{stage.order}</span>
                )}
              </span>

              <div className={`rounded-lg border p-3 space-y-1.5
                ${isApproved ? "border-green-200 bg-green-50" :
                  isPending  ? "border-gray-200 bg-gray-50 opacity-60" :
                               "border-maroon-200 bg-white shadow-sm"}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700">
                    Stage {stage.order} — {stage.label}
                  </span>
                  <StageBadge status={stage.status} simpleMode={simpleMode} />
                </div>

                <p className="text-xs text-gray-500">
                  Assignee: <span className="font-medium text-gray-700">
                    {stage.assignee?.name ?? `User #${stage.assignee_id}`}
                  </span>
                </p>

                 {/* Action buttons */}
                {!viewingArchived && isActive && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(staffCanAct || adminCanAct || eicCanAct) && advanceLabel && (
                      <button
                        className="btn-primary text-xs py-1 px-3 flex items-center justify-center min-h-[28px]"
                        onClick={() => handleAdvance(stage.id)}
                        disabled={busy !== null}
                      >
                        {busy?.type === "advance" && busy?.stageId === stage.id
                          ? renderLoadingContent("Working...")
                          : advanceLabel}
                      </button>
                    )}

                    {canSendBack && (
                      <button
                        className="btn-secondary text-xs py-1 px-3 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => { setRevisionComment(""); setRevisionStageId(stage.id); }}
                        disabled={busy !== null}
                      >
                        Send Back
                      </button>
                    )}

                    {canPokeStage && (
                      <button
                        className="btn-secondary text-xs py-1 px-3 flex items-center gap-1 min-h-[28px]"
                        onClick={() => handlePoke(stage.id)}
                        disabled={busy !== null}
                      >
                        {busy?.type === "poke" && busy?.stageId === stage.id ? (
                          renderLoadingContent("Poking...")
                        ) : (
                          <>
                            <BellAlertIcon className="w-3.5 h-3.5" /> Poke
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Send-back modal */}
      {revisionStageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRevisionStageId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Send Back for Revision</h3>
            <p className="text-sm text-gray-500">
              Leave a comment explaining what needs to be revised. The assignee will be notified.
            </p>
            <textarea
              className="input"
              rows={4}
              placeholder="e.g. Please revise the caption — it's too long."
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              autoFocus
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
                {busy?.type === "send_back" && busy?.stageId === revisionStageId
                  ? renderLoadingContent("Sending...")
                  : "Send Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskDetail({ task, onUpdated, onDeleted, onClose, viewingArchived = false }) {
  const { user, isSuperAdmin, canWrite } = useAuth();
  const [busy, setBusy]               = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editBusy, setEditBusy]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = task.status;
  const now = new Date();
  const deadline = new Date(task.deadline);
  const isOverdue   = deadline < now;
  const isPublished = status === "published";
  const isAssigned  = status === "assigned";

  // Archive: only if published or overdue
  const canArchive = canWrite && (isPublished || isOverdue);
  // Delete: only if still assigned (nobody touched it yet), EIC only
  const canDelete  = isSuperAdmin && isAssigned;

  const run = async (fn, successMsg, afterFn) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      if (afterFn) afterFn();
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (payload) => {
    setEditBusy(true);
    try {
      const updated = await updateTask(task.id, payload);
      toast.success("Task updated.");
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Failed to update task.");
    } finally {
      setEditBusy(false);
    }
  };

  const handleArchive = () =>
    run(() => archiveTask(task.id), "Task archived.", () => { onDeleted(task.id); onClose(); });

  const handleUnarchive = () =>
    run(() => unarchiveTask(task.id), "Task unarchived.", () => { onDeleted(task.id); onClose(); });

  const handleDelete = () =>
    run(() => deleteTask(task.id), "Task deleted.", () => { onDeleted(task.id); onClose(); });

  // Show edit form inline
  if (editing) {
    return (
      <TaskForm
        initial={{
          title:       task.title,
          description: task.description ?? "",
          category:    task.category ?? "",
          event_tag:   task.event_tag ?? "",
          drive_link:  task.drive_link ?? "",
          deadline:    format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm"),
          stages:      task.stages ?? [],
        }}
        onSubmit={handleEdit}
        onCancel={() => setEditing(false)}
        loading={editBusy}
        isEdit
      />
    );
  }

  // Stage progress summary
  const stages = task.stages ?? [];
  const approvedCount = stages.filter((s) => s.status === "approved").length;
  const activeStage = stages.find((s) =>
    !["pending", "approved"].includes(s.status)
  );

  // Edit: only when no stage has been acknowledged yet
  const hasActiveStage = stages.some((s) =>
    ["acknowledged", "submitted", "checked", "needs_revision"].includes(s.status)
  );
  const canEdit = canWrite && !hasActiveStage && !isPublished;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={task.status} />
        {task.event_tag && (
          <span className="badge bg-maroon-50 text-maroon-700">{task.event_tag}</span>
        )}
        {stages.length > 0 && (
          <span className="text-xs text-gray-500 ml-1">
            {approvedCount}/{stages.length} stage{stages.length !== 1 ? "s" : ""} approved
          </span>
        )}
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1 text-xs text-maroon-700 hover:underline"
          >
            <PencilIcon className="w-3.5 h-3.5" /> Edit
          </button>
        )}
        {!canEdit && status !== "published" && canWrite && (
          <span className="ml-auto text-xs text-gray-400 italic">Locked — stage in progress</span>
        )}
      </div>

      {task.description && <p className="text-sm text-gray-700">{task.description}</p>}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Category</dt>
          <dd className="font-medium">{task.category || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Deadline</dt>
          <dd className="font-medium">{format(new Date(task.deadline), "MMM d, yyyy h:mm a")}</dd>
        </div>
        {activeStage && (
          <div>
            <dt className="text-gray-500">Active Stage</dt>
            <dd className="font-medium">
              {activeStage.label} — {activeStage.assignee?.name ?? `User #${activeStage.assignee_id}`}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-gray-500">Created</dt>
          <dd className="font-medium">{format(new Date(task.created_at), "MMM d, yyyy")}</dd>
        </div>
      </dl>

      {task.drive_link && (
        <a href={task.drive_link} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-maroon-700 underline">
          Open Google Drive Link ↗
        </a>
      )}

      {/* Stage timeline */}
      {stages.length > 0 && (
        <StageTimeline
          task={task}
          currentUser={user}
          onUpdated={onUpdated}
          viewingArchived={viewingArchived}
        />
      )}

      {/* Task-level actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {canWrite && (
          viewingArchived ? (
            <button className="btn-secondary" onClick={handleUnarchive} disabled={busy}>
              Unarchive
            </button>
          ) : canArchive ? (
            <button className="btn-secondary ml-auto" onClick={handleArchive} disabled={busy}>
              Archive
            </button>
          ) : null
        )}

        {canDelete && (
          <button
            className={`btn-danger${!canArchive ? " ml-auto" : ""}`}
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            Delete
          </button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
