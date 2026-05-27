/**
 * StatusBadge — color-coded task status pill per SRS section 8.1.
 */
import { useSimpleMode } from "../../context/SimpleModeContext";
import { taskStatusLabel } from "../../constants/labels";

const STATUS_STYLES = {
  assigned:       "bg-blue-100 text-blue-700",
  acknowledged:   "bg-blue-100 text-blue-800",
  submitted:      "bg-yellow-100 text-yellow-800",
  checked:        "bg-purple-100 text-purple-800",
  needs_revision: "bg-red-100 text-red-700",
  pending_eic:    "bg-purple-100 text-purple-800",
  published:      "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }) {
  const { simpleMode } = useSimpleMode();
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {taskStatusLabel(status, simpleMode)}
    </span>
  );
}
