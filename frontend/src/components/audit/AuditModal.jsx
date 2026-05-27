/**
 * AuditModal — read-only audit log with pagination.
 */
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import Pagination from "../ui/Pagination";
import { getAuditLogs } from "../../services/auditService";

const ACTION_STYLES = {
  ACCOUNT_CREATED: "bg-green-100 text-green-700",
  USER_UPDATED:    "bg-blue-100 text-blue-700",
  EIC_TRANSFER:    "bg-maroon-100 text-maroon-700",
};
const PAGE_SIZE = 10;

export default function AuditModal({ onClose }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginated  = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Modal title="Audit Log" onClose={onClose}>
      <p className="text-xs text-gray-400 mb-4">
        Immutable record of all administrative actions.
        {logs.length > 0 && ` (${logs.length} entries)`}
      </p>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShieldCheckIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No audit entries yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`badge flex-shrink-0 mt-0.5 ${ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                  {log.action.replace(/_/g, " ")}
                </span>
                <div className="flex-1 min-w-0">
                  {log.detail && <p className="text-sm text-gray-700">{log.detail}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Admin #{log.admin_id}
                    {log.affected_user_id ? ` · User #${log.affected_user_id}` : ""}
                    {" · "}{format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </Modal>
  );
}
