/**
 * AuditModal — read-only audit log with search and filters (FR-17).
 * Allows the EIC to filter logs by action type, details, or date range.
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
  PASSWORD_CHANGED: "bg-amber-100 text-amber-700",
  PROFILE_UPDATED:  "bg-purple-100 text-purple-700",
  DB_BACKUP_COMPLETED: "bg-teal-100 text-teal-700",
};
const PAGE_SIZE = 10;

export default function AuditModal({ onClose }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");

  const fetchLogs = () => {
    setLoading(true);
    const params = {};
    if (actionFilter) params.action = actionFilter;
    if (searchQuery) params.search = searchQuery;
    if (startDate) params.start_date = new Date(startDate).toISOString();
    if (endDate) {
      const d = new Date(endDate);
      d.setHours(23, 59, 59, 999);
      params.end_date = d.toISOString();
    }

    getAuditLogs(params)
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClear = () => {
    setActionFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setLoading(true);
    getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginated  = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Modal title="Audit Log" onClose={onClose}>
      <p className="text-xs text-gray-400 mb-4">
        Immutable record of all administrative actions.
        {logs.length > 0 && ` (${logs.length} entries)`}
      </p>

      {/* Filters Panel */}
      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 items-end">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Action Type</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 px-2 bg-white"
          >
            <option value="">All Actions</option>
            <option value="ACCOUNT_CREATED">Account Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="EIC_TRANSFER">EIC Succession</option>
            <option value="PASSWORD_CHANGED">Password Changed</option>
            <option value="PROFILE_UPDATED">Profile Updated</option>
            <option value="DB_BACKUP_COMPLETED">DB Backup</option>
          </select>
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 px-2 bg-white"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 px-2 bg-white"
          />
        </div>
        <div className="flex-[2] min-w-[180px] flex gap-1">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Search Details</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search details, name..."
              className="input text-xs py-1.5 px-2 bg-white"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary py-1.5 px-3 text-xs font-semibold shrink-0 h-[34px]"
          >
            Search
          </button>
        </div>
        {(actionFilter || searchQuery || startDate || endDate) && (
          <button
            onClick={handleClear}
            className="btn-ghost py-1.5 px-2 text-xs font-semibold text-gray-500 shrink-0 h-[34px]"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ShieldCheckIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No matching audit entries.</p>
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
