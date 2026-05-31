/** Plain-language labels when Simple mode is on. */

export const TASK_STATUS = {
  assigned:       { full: "Assigned",           simple: "New" },
  acknowledged:   { full: "Acknowledged",       simple: "Seen" },
  submitted:      { full: "Submitted to Head", simple: "Turned in" },
  checked:        { full: "Checked by Head",   simple: "Head approved" },
  needs_revision: { full: "Needs Revision",    simple: "Fix and resubmit" },
  pending_eic:    { full: "Pending EIC Approval", simple: "Pending EIC" },
  published:      { full: "Published",         simple: "Done ✓" },
};

export const STAGE_STATUS = {
  pending:        { full: "Pending",        simple: "Waiting" },
  assigned:       { full: "Assigned",       simple: "New" },
  acknowledged:   { full: "Acknowledged",   simple: "Seen" },
  submitted:      { full: "Submitted",      simple: "Turned in" },
  checked:        { full: "Checked",        simple: "Checked" },
  needs_revision: { full: "Needs Revision", simple: "Fix needed" },
  approved:       { full: "Approved ✓",     simple: "Done ✓" },
};

export const ADVANCE_ACTION = {
  "assigned-staff":         { full: "Acknowledge Receipt",      simple: "I got it" },
  "acknowledged-staff":     { full: "Submit to Head",             simple: "Turn in" },
  "needs_revision-staff":   { full: "Re-acknowledge (Revised)", simple: "Fixed — ready again" },
  "submitted-admin":        { full: "Approve — Check",          simple: "Looks good" },
  "submitted-super_admin":  { full: "Approve & Publish Stage",  simple: "Publish" },
  "checked-super_admin":    { full: "Approve & Publish Stage",  simple: "Publish" },
};

export function label(map, key, simple) {
  const entry = map[key];
  if (!entry) return key?.replace(/_/g, " ") ?? "";
  return simple ? entry.simple : entry.full;
}

export function taskStatusLabel(status, simple) {
  return label(TASK_STATUS, status, simple);
}

export function stageStatusLabel(status, simple) {
  return label(STAGE_STATUS, status, simple);
}

export function advanceActionLabel(key, simple) {
  return label(ADVANCE_ACTION, key, simple);
}

export function tasksPageTitle(simple, canViewAll) {
  if (!simple) return "Master List";
  return canViewAll ? "All tasks" : "My tasks";
}

export const NAV = {
  dashboard:  { full: "Dashboard",    simple: "Home" },
  tasks:      { full: "Master List",  simple: "Tasks" },
  my_tasks:   { full: "My Tasks",     simple: "My Tasks" },
  directory:  { full: "Directory",    simple: "People" },
  admin:      { full: "Admin Center", simple: "Admin" },
};

export function navLabel(key, simple) {
  return simple ? NAV[key]?.simple : NAV[key]?.full;
}
