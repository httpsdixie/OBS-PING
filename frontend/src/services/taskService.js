/**
 * Task service — all task-related API calls.
 */
import api from "./api";

export const getTasks = (params) =>
  api.get("/tasks/", { params }).then((r) => r.data);

export const createTask = (payload) =>
  api.post("/tasks/", payload).then((r) => r.data);

export const updateTask = (id, payload) =>
  api.patch(`/tasks/${id}`, payload).then((r) => r.data);

export const advanceStage = (taskId, stageId) =>
  api.post(`/tasks/${taskId}/stages/${stageId}/advance`).then((r) => r.data);

export const sendStageBack = (taskId, stageId, comment) =>
  api.post(`/tasks/${taskId}/stages/${stageId}/send-back`, { comment }).then((r) => r.data);

export const pokeStage = (taskId, stageId) =>
  api.post(`/tasks/${taskId}/stages/${stageId}/poke`).then((r) => r.data);

export const archiveTask = (id) =>
  api.post(`/tasks/${id}/archive`).then((r) => r.data);

export const unarchiveTask = (id) =>
  api.post(`/tasks/${id}/unarchive`).then((r) => r.data);

export const deleteTask = (id) =>
  api.delete(`/tasks/${id}`).then((r) => r.data);

export const getTask = (id) =>
  api.get(`/tasks/${id}`).then((r) => r.data);
