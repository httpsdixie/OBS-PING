/**
 * Audit service — fetch audit log entries.
 */
import api from "./api";

export const getAuditLogs = () =>
  api.get("/audit/").then((r) => r.data);
