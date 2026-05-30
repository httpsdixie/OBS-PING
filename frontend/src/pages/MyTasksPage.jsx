/**
 * MyTasksPage — staff-only view of their own assigned tasks.
 * Shows tasks sorted by deadline with status badges and a detail modal.
 */
import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { useSimpleMode } from "../context/SimpleModeContext";
import { taskStatusLabel } from "../constants/labels";
import TaskCard from "../components/tasks/TaskCard";
import TaskDetail from "../components/tasks/TaskDetail";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import { FunnelIcon } from "@heroicons/react/24/outline";

const STATUSES  = ["assigned","acknowledged","submitted","checked","needs_revision"];
const PAGE_SIZE = 10;

export default function MyTasksPage() {
  const { simpleMode } = useSimpleMode();

  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters,  setShowFilters]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState(null);

  const filters = { archived: false };
  if (statusFilter) filters.task_status = statusFilter;

  const { tasks, setTasks, loading } = useTasks(filters);

  const handleUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  const handleDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected(null);
  };

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const paginated  = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {simpleMode ? "My Tasks" : "My Tasks"}
          </h1>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned to you
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-secondary flex items-center gap-1 text-sm"
        >
          <FunnelIcon className="w-4 h-4" />
          {simpleMode ? "Filter" : "Filters"}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card flex flex-wrap gap-3">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{taskStatusLabel(s, simpleMode)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="btn-ghost text-sm"
              onClick={() => { setStatusFilter(""); setPage(1); }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : tasks.length === 0 ? (
        <p className="text-center text-gray-500 py-20 text-sm max-w-sm mx-auto">
          {simpleMode
            ? "Nothing here yet. When someone assigns you work, it will show up."
            : "No tasks assigned to you."}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((t) => (
              <TaskCard key={t.id} task={t} onClick={setSelected} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <TaskDetail
            task={selected}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}
    </div>
  );
}
