/**
 * RoleBadge — displays user role with appropriate color.
 */
const ROLE_STYLES = {
  super_admin: "bg-maroon-100 text-maroon-700",
  admin:       "bg-orange-100 text-orange-700",
  consultant:  "bg-purple-100 text-purple-700",
  staff:       "bg-gray-100 text-gray-700",
};

const ROLE_LABELS = {
  super_admin: "EIC",
  admin:       "Ed Board",
  consultant:  "Consultant",
  staff:       "Staff",
};

export default function RoleBadge({ role }) {
  return (
    <span className={`badge ${ROLE_STYLES[role] ?? "bg-gray-100 text-gray-600"}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
