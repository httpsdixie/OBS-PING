/**
 * ConfirmDialog — used for destructive/irreversible actions (e.g. EIC succession).
 */
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? "btn-danger" : "btn-primary"}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
