/**
 * StaffPickerModal — browseable staff directory for picking stage assignees (UC-01).
 */
import { useState } from "react";
import { useUsers } from "../../hooks/useUsers";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import Pagination from "../ui/Pagination";
import RoleBadge from "../ui/RoleBadge";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const PAGE_SIZE = 8;

function StaffPickerRow({ user, selected, onSelect }) {
  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className={`card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow ${
        selected ? "ring-2 ring-maroon-700 bg-maroon-50" : ""
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-maroon-700 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {user.position && (
          <p className="text-xs text-gray-500 truncate">{user.position}</p>
        )}
      </div>
      <RoleBadge role={user.role} />
    </button>
  );
}

export default function StaffPickerModal({ title, selectedId, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = { status: "active" };
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;

  const { users, loading } = useUsers(params);
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Modal title={title} onClose={onClose} size="lg" zIndex={60}>
      <p className="text-xs text-gray-500 mb-4">
        Search and pick a staff member for this stage. Only active members are shown.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input sm:w-40 text-sm"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="staff">Staff</option>
          <option value="admin">Ed Board</option>
          <option value="consultant">Consultant</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">No members found.</p>
      ) : (
        <>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {paginated.map((u) => (
              <StaffPickerRow
                key={u.id}
                user={u}
                selected={selectedId === u.id}
                onSelect={onSelect}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </>
      )}
    </Modal>
  );
}