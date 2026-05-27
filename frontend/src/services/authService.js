/**
 * Auth service — login with OTP, forgot password, logout, current user.
 */
import api from "./api";

function apiError(err, fallback) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg ?? d).join(", ");
  return fallback;
}

export async function requestLoginOtp(email, password) {
  const { data } = await api.post("/auth/login/request", { email, password });
  if (data.otp_required === false && data.access_token) {
    localStorage.setItem("token", data.access_token);
  }
  return data;
}

export async function verifyLoginOtp(challengeToken, otp) {
  const { data } = await api.post("/auth/login/verify", {
    challenge_token: challengeToken,
    otp,
  });
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function requestForgotPasswordOtp(email) {
  const { data } = await api.post("/auth/forgot-password/request", { email });
  return data;
}

export async function verifyForgotPasswordOtp(challengeToken, otp) {
  const { data } = await api.post("/auth/forgot-password/verify", {
    challenge_token: challengeToken,
    otp,
  });
  return data;
}

export async function resetPasswordWithOtp(resetToken, newPassword) {
  const { data } = await api.post("/auth/forgot-password/reset", {
    reset_token: resetToken,
    new_password: newPassword,
  });
  return data;
}

/** @deprecated Use requestLoginOtp + verifyLoginOtp */
export async function login(email, password) {
  const challenge = await requestLoginOtp(email, password);
  if (!challenge.challenge_token) throw new Error("OTP required");
  return challenge;
}

export function logout() {
  localStorage.removeItem("token");
}

export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}

export { apiError };
