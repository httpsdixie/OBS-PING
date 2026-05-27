/**
 * DirectoryPage — searchable staff directory with pagination (FR-03).
 * EIC can update position and role inline for yearly board turnover.
 */
import { useState } from "react";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../context/AuthContext";
import { useSimpleMode } from "../context/SimpleModeContext";
import { navLabel } from "../constants/labels";
import Spinner from "../components/ui/Spinner";
import Pagination from "../components/ui/Pagination";
import DirectoryMemberRow from "../components/directory/DirectoryMemberRow";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const PAGE_SIZE = 15;

export default function DirectoryPage() {
  const { isSuperAdmin } = useAuth();
  const { simpleMode } = useSimpleMode();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [page, setPage] = useState(1);

  const params = {};
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;
  params.status = showDeactivated ? "deactivated" : "active";

  const { users, setUsers, loading } = useUsers(params);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpdated = (updated) =>
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {simpleMode ? navLabel("directory", true) : "Staff Directory"}
        </h1>
        {!loading && (
          <p className="text-xs text-gray-400 mt-0.5">
            {users.length} member{users.length !== 1 ? "s" : ""}
          </p>
        )}
        {isSuperAdmin && (
          <p className="text-xs text-maroon-700 mt-1">
            As EIC, use the position and role dropdowns to update the editorial board each year.
            Transfer the EIC role from Admin Center when leadership changes.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input sm:w-44"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="super_admin">EIC</option>
          <option value="admin">Ed Board</option>
          <option value="consultant">Consultant</option>
          <option value="staff">Staff</option>
        </select>
        <button
          onClick={() => { setShowDeactivated((v) => !v); setPage(1); }}
          className={`btn-secondary text-sm flex-shrink-0 ${showDeactivated ? "bg-red-50 border-red-300 text-red-700" : ""}`}
        >
          {showDeactivated ? "Showing Deactivated" : "Deactivated"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-20">No members found.</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((u) => (
              <DirectoryMemberRow
                key={u.id}
                user={u}
                editable={isSuperAdmin}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
