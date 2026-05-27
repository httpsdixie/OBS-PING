/**
 * TaskForm — create/edit task form with multi-stage assignment.
 * Each stage has a label (role) and an assignee.
 * Stages are ordered; at least 1 stage is required.
 */
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, UserGroupIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import StaffPickerModal from "../users/StaffPickerModal";
import DeadlinePickerModal from "./DeadlinePickerModal";
import { useSimpleMode } from "../../context/SimpleModeContext";

const STAGE_LABELS = [
  "Writer",
  "Layout",
  "Photographer",
  "Illustrator",
  "Cartoonist",
  "Video Editor",
  "Correspondent",
  "Caption Writer",
];

const EMPTY_STAGE = { label: "Writer", assignee_id: "", search: "" };

const EMPTY_TASK = {
  title: "", description: "", category: "",
  drive_link: "", deadline: "",
};

function StageRow({ stage, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePick = (user) => {
    onChange(index, "assignee_id", String(user.id));
    onChange(index, "search", user.name);
    setShowPicker(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 w-6 shrink-0">#{index + 1}</span>

        {/* Label */}
        <select
          className="input flex-1"
          value={stage.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
        >
          {STAGE_LABELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Reorder buttons */}
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          title="Move up"
        >
          <ChevronUpIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          title="Move down"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {/* Remove */}
        {total > 1 && (
          <button
            type="button"
            className="p-1 text-red-400 hover:text-red-600"
            onClick={() => onRemove(index)}
            title="Remove stage"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Assignee — browse directory (Master List style) */}
      <div className="space-y-1">
        <button
          type="button"
          className="input text-sm w-full text-left flex items-center justify-between gap-2 hover:border-maroon-300"
          onClick={() => setShowPicker(true)}
        >
          <span className={stage.assignee_id ? "text-gray-900" : "text-gray-400"}>
            {stage.search || "Choose from directory…"}
          </span>
          <UserGroupIcon className="w-4 h-4 text-maroon-700 shrink-0" />
        </button>
        {stage.assignee_id && (
          <button
            type="button"
            className="text-xs text-gray-500 hover:text-maroon-700"
            onClick={() => {
              onChange(index, "assignee_id", "");
              onChange(index, "search", "");
            }}
          >
            Clear selection
          </button>
        )}
      </div>

      {showPicker && (
        <StaffPickerModal
          title={`Assign ${stage.label}`}
          selectedId={stage.assignee_id ? Number(stage.assignee_id) : null}
          onSelect={handlePick}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

export default function TaskForm({ initial = {}, onSubmit, onCancel, loading, isEdit = false }) {
  const { simpleMode } = useSimpleMode();
  const [showAdvanced, setShowAdvanced] = useState(isEdit || !simpleMode);
  const [form, setForm] = useState({ ...EMPTY_TASK, ...initial });

  // Initialise stages from existing task (edit mode) or a single blank stage
  const initStages = () => {
    if (initial.stages && initial.stages.length > 0) {
      return initial.stages.map((s) => ({
        label: s.label,
        assignee_id: String(s.assignee_id),
        search: s.assignee?.name ?? "",
      }));
    }
    return [{ ...EMPTY_STAGE }];
  };

  const [stages, setStages] = useState(initStages);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const setField = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateStage = (index, field, value) => {
    setStages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addStage = () => setStages((prev) => [...prev, { ...EMPTY_STAGE }]);

  const removeStage = (index) =>
    setStages((prev) => prev.filter((_, i) => i !== index));

  const moveUp = (index) => {
    if (index === 0) return;
    setStages((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    setStages((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stages.some((s) => !s.assignee_id)) {
      return; // HTML required will catch this, but guard anyway
    }
    onSubmit({
      ...form,
      stages: stages.map((s) => ({
        label: s.label,
        assignee_id: Number(s.assignee_id),
      })),
    });
  };

  const allAssigned = stages.every((s) => s.assignee_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Policy reminder */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
        <strong>{simpleMode ? "Tip:" : "Policy Reminder:"}</strong>{" "}
        {simpleMode
          ? "Pick a due date a few days before you need it posted."
          : "Set deadlines 2–3 days before the actual posting date."}
      </div>

      <div>
        <label className="label">{simpleMode ? "What is this task? *" : "Title *"}</label>
        <input className="input" value={form.title} onChange={setField("title")} required placeholder={simpleMode ? "e.g. Friday meme post" : ""} />
      </div>

      {showAdvanced && (
        <>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={setField("description")} />
      </div>

      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={setField("category")}>
          <option value="">— No Category —</option>
          <option>LITERARY</option>
          <option>U-THOUGHTS</option>
          <option>MEME</option>
          <option>TIGPANIID</option>
          <option>Holiday</option>
          <option>National Event</option>
        </select>
      </div>

      <div>
        <label className="label">Google Drive Link</label>
        <input className="input" type="url" value={form.drive_link} onChange={setField("drive_link")} placeholder="https://drive.google.com/..." />
      </div>
        </>
      )}

      <div>
        <label className="label">{simpleMode ? "When is it due? *" : "Deadline *"}</label>
        <button
          type="button"
          className="input w-full text-left flex items-center justify-between gap-2 hover:border-maroon-300"
          onClick={() => setShowDeadlinePicker(true)}
        >
          <span className={form.deadline ? "text-gray-900" : "text-gray-400"}>
            {form.deadline
              ? format(parseISO(form.deadline), "EEEE, MMM d, yyyy 'at' h:mm a")
              : (simpleMode ? "Tap to pick date on calendar…" : "Pick deadline on calendar…")}
          </span>
          <CalendarDaysIcon className="w-5 h-5 text-maroon-700 shrink-0" />
        </button>
      </div>

      {showDeadlinePicker && (
        <DeadlinePickerModal
          value={form.deadline}
          onSelect={(deadline) => setForm((f) => ({ ...f, deadline }))}
          onClose={() => setShowDeadlinePicker(false)}
        />
      )}

      {/* Stages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            {simpleMode ? "Who does the work? *" : "Stages *"}
            {showAdvanced && !simpleMode && (
              <span className="text-gray-400 font-normal"> (in order)</span>
            )}
          </label>
          {showAdvanced && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-maroon-700 hover:underline font-medium"
              onClick={addStage}
            >
              <PlusIcon className="w-3.5 h-3.5" /> Add Stage
            </button>
          )}
        </div>

        <div className="space-y-2">
          {(showAdvanced ? stages : stages.slice(0, 1)).map((stage, idx) => (
            <StageRow
              key={idx}
              stage={stage}
              index={idx}
              total={stages.length}
              onChange={updateStage}
              onRemove={removeStage}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>
      </div>

      {simpleMode && !isEdit && !showAdvanced && (
        <button
          type="button"
          className="text-sm text-maroon-700 hover:underline w-full text-center"
          onClick={() => setShowAdvanced(true)}
        >
          More options (notes, category, extra steps…)
        </button>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading || !allAssigned || !form.deadline}>
          {loading ? "Saving…" : isEdit ? "Save Changes" : (simpleMode ? "Assign" : "Assign Task")}
        </button>
      </div>
    </form>
  );
}

