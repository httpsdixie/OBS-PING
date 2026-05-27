/**
 * User service — directory and account management API calls.
 */
import api from "./api";

export const getUsers = (params) =>
  api.get("/users/", { params }).then((r) => r.data);

export const getUser = (id) =>
  api.get(`/users/${id}`).then((r) => r.data);

export const createUser = (payload) =>
  api.post("/users/", payload).then((r) => r.data);

export const updateUser = (id, payload) =>
  api.patch(`/users/${id}`, payload).then((r) => r.data);

export const updateMe = (payload) =>
  api.patch("/users/me", payload).then((r) => r.data);

export const changePassword = (payload) =>
  api.post("/users/me/password", payload);

export const transferEIC = (newEicUserId, formerEicPosition) =>
  api.post("/users/succession", {
    new_eic_user_id: newEicUserId,
    former_eic_position: formerEicPosition || null,
  }).then((r) => r.data);
