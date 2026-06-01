/**
 * TasksPage — Master List with List/Grid toggle and Calendar view (FR-06), filters (FR-07),
 * pagination, and task creation for admins (UC-01).
 */
import { useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../context/AuthContext";
import { useSimpleMode } from "../context/SimpleModeContext";
import { tasksPageTitle, taskStatusLabel } from "../constants/labels";
import LabeledToolButton from "../components/ui/LabeledToolButton";
import { createTask } from "../services/taskService";
import TaskCard from "../components/tasks/TaskCard";
import TaskDetail from "../components/tasks/TaskDetail";
import TaskForm from "../components/tasks/TaskForm";
import CalendarView from "../components/tasks/CalendarView";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import {
  ListBulletIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  PlusIcon,
  FunnelIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

const STATUSES = ["assigned","acknowledged","submitted","checked","needs_revision"];
const CATEGORIES = ["LITERARY","U-THOUGHTS","MEME","TIGPANIID","Holiday","National Event"];
const PAGE_SIZE  = 10;

export default function TasksPage() {
  const { canWrite, canViewAll, user } = useAuth();
  const { simpleMode } = useSimpleMode();

  const [tab,            setTab]            = useState("all"); // "all" | "mine"
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [view,           setView]           = useState("list"); // list | grid | timeline
  const [showFilters,    setShowFilters]    = useState(false);
  const [page,           setPage]           = useState(1);
  const [archiveMode,    setArchiveMode]    = useState(false);

  const filters = {};
  if (statusFilter)   filters.task_status = statusFilter;
  if (categoryFilter) filters.category    = categoryFilter;
  filters.archived = archiveMode;

  const { tasks: allTasks, setTasks, loading } = useTasks(filters);

  // "My Tasks" tab: tasks where the current user is a stage assignee
  const tasks = tab === "mine"
    ? allTasks.filter((t) => t.stages?.some((s) => s.assignee_id === user?.id))
    : allTasks;

  const [selected,   setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [initialTaskFormValues, setInitialTaskFormValues] = useState({});

  const handleDayClick = (day) => {
    if (canWrite) {
      const selectedDateIso = format(day, "yyyy-MM-dd'T'17:00:00");
      setInitialTaskFormValues({ deadline: selectedDateIso });
      setShowCreate(true);
    }
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleTabChange = (t) => {
    setTab(t);
    setPage(1);
    setSelected(null);
  };

  const toggleArchiveMode = () => {
    setArchiveMode((v) => !v);
    setPage(1);
    setSelected(null);
    setStatusFilter("");
    setCategoryFilter("");
  };

  const handleCreate = async (payload) => {
    setCreateBusy(true);
    try {
      const t = await createTask(payload);
      setTasks((prev) => [t, ...prev]);
      setShowCreate(false);
      setPage(1);
      toast.success("Task created.");
    } catch (e) {
      toast.error(e.response?.data?.detail ?? "Failed to create task.");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  const handleDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleListGrid = () => {
    setView((v) => (v === "list" ? "grid" : "list"));
    setPage(1);
  };

  // Pagination slice (list and grid views)
  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const paginated  = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isCardView = view === "list" || view === "grid";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tasksPageTitle(simpleMode, canViewAll)}
          </h1>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {simpleMode ? "Tap a task to open it" : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {simpleMode ? (
            <>
              <LabeledToolButton
                active={isCardView && view === "list"}
                onClick={() => { setView("list"); setPage(1); }}
                icon={ListBulletIcon}
                label="List"
                title="List view"
              />
              <LabeledToolButton
                active={isCardView && view === "grid"}
                onClick={() => { setView("grid"); setPage(1); }}
                icon={Squares2X2Icon}
                label="Grid"
                title="Grid view"
              />
              <LabeledToolButton
                active={view === "timeline"}
                onClick={() => { setView("timeline"); setPage(1); }}
                icon={CalendarDaysIcon}
                label="Calendar"
                title="Calendar view"
              />
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="btn-secondary flex items-center gap-1 text-sm"
              >
                <FunnelIcon className="w-4 h-4" /> Filter
              </button>
              {canWrite && (
                <LabeledToolButton
                  active={archiveMode}
                  onClick={toggleArchiveMode}
                  icon={ArchiveBoxIcon}
                  label="Archive"
                  title="Archived tasks"
                />
              )}
            </>
          ) : (
            <>
              <button
                onClick={toggleListGrid}
                className={`p-2 rounded-lg min-h-[44px] min-w-[44px] ${isCardView ? "bg-maroon-700 text-white" : "bg-white text-gray-600 border"}`}
                aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
                title={view === "grid" ? "List view" : "Grid view"}
              >
                {view === "grid" ? <ListBulletIcon className="w-5 h-5" /> : <Squares2X2Icon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => { setView("timeline"); setPage(1); }}
                className={`p-2 rounded-lg min-h-[44px] min-w-[44px] ${view === "timeline" ? "bg-maroon-700 text-white" : "bg-white text-gray-600 border"}`}
                aria-label="Calendar view"
                title="Calendar view"
              >
                <CalendarDaysIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary flex items-center gap-1">
                <FunnelIcon className="w-4 h-4" /> Filters
              </button>
              {canWrite && (
                <button
                  onClick={toggleArchiveMode}
                  className={`p-2 rounded-lg min-h-[44px] min-w-[44px] ${archiveMode ? "bg-amber-600 text-white" : "bg-white text-gray-600 border"}`}
                  aria-label="Toggle archive view"
                  title={archiveMode ? "Exit archive view" : "View archived tasks"}
                >
                  <ArchiveBoxIcon className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          {canWrite && !archiveMode && (
            <button onClick={() => { setInitialTaskFormValues({}); setShowCreate(true); }} className="btn-primary flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> {simpleMode ? "New task" : "New Task"}
            </button>
          )}
        </div>
      </div>

      {/* All Tasks / My Tasks tabs — admins and EIC only */}
      {canViewAll && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "all"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {simpleMode ? "All tasks" : "All Tasks"}
          </button>
          <button
            onClick={() => handleTabChange("mine")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "mine"
                ? "border-maroon-700 text-maroon-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {simpleMode ? "My tasks" : "My Tasks"}
          </button>
        </div>
      )}

      {/* Archive mode banner */}
      {archiveMode && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800 font-medium flex items-center gap-2">
          <ArchiveBoxIcon className="w-4 h-4 shrink-0" />
          Viewing Archived Tasks
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card flex flex-wrap gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={statusFilter} onChange={handleFilterChange(setStatusFilter)}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{taskStatusLabel(s, simpleMode)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-ghost text-sm" onClick={() => { setStatusFilter(""); setCategoryFilter(""); setPage(1); }}>
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
          {archiveMode
            ? (simpleMode ? "No old tasks here." : "No archived tasks.")
            : tab === "mine"
            ? (simpleMode ? "You have no tasks assigned to you." : "No tasks assigned to you.")
            : (simpleMode ? "Nothing here yet." : "No tasks found.")}
        </p>
      ) : isCardView ? (
        <>
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-2"}>
            {paginated.map((t) => (
              <TaskCard key={t.id} task={t} onClick={setSelected} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      ) : (
        // Calendar view — Google Calendar style monthly grid
        <CalendarView
          tasks={tasks}
          onTaskClick={setSelected}
          onDaySelect={canWrite ? handleDayClick : undefined}
        />
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <TaskDetail
            task={selected}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onClose={() => setSelected(null)}
            viewingArchived={archiveMode}
          />
        </Modal>
      )}
      {showCreate && (
        <Modal title={simpleMode ? "Assign new work" : "New Task"} onClose={() => setShowCreate(false)}>
          <TaskForm
            initial={initialTaskFormValues}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={createBusy}
          />
        </Modal>
      )}
    </div>
  );
}
