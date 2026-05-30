/**
 * LoginPage — sign in with email/password + OTP; forgot password with OTP.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  requestLoginOtp,
  verifyLoginOtp,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  getMe,
  apiError,
} from "../services/authService";
import { useAuth } from "../context/AuthContext";

const OTP_LEN = 6;

function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const digits = value.padEnd(OTP_LEN, " ").split("").slice(0, OTP_LEN);
  const setDigit = (index, char) => {
    if (!/^\d?$/.test(char)) return;
    const arr = digits.map((d) => (d === " " ? "" : d));
    arr[index] = char;
    onChange(arr.join("").replace(/\s/g, ""));
    if (char && index < OTP_LEN - 1) refs.current[index + 1]?.focus();
  };
  const onKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0)
      refs.current[index - 1]?.focus();
  };
  const onPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    onChange(pasted);
    refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  };
  return (
    <div className="flex justify-center gap-2" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700"
          value={d.trim()}
          onChange={(e) => setDigit(i, e.target.value.slice(-1))}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const resetFlow = () => {
    setStep("credentials");
    setOtp("");
    setChallengeToken("");
    setResetToken("");
    setDevOtp(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const switchMode = (next) => {
    setMode(next);
    resetFlow();
  };

  const handleLoginCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await requestLoginOtp(email, password);
      if (data.otp_required === false) {
        const me = await getMe();
        setUser(me);
        toast.success(`Welcome back, ${me.name.split(" ")[0]}!`);
        navigate("/dashboard");
        return;
      }
      setChallengeToken(data.challenge_token);
      setDevOtp(data.dev_otp ?? null);
      setStep("otp");
      toast.success(data.message);
    } catch (err) {
      toast.error(apiError(err, "Incorrect email or password."));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LEN) return toast.error("Enter the 6-digit code.");
    setLoading(true);
    try {
      await verifyLoginOtp(challengeToken, otp);
      const me = await getMe();
      setUser(me);
      toast.success(`Welcome back, ${me.name.split(" ")[0]}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(apiError(err, "Verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await requestForgotPasswordOtp(email);
      if (!data.challenge_token) {
        toast.success(data.message);
        switchMode("login");
        return;
      }
      setChallengeToken(data.challenge_token);
      setDevOtp(data.dev_otp ?? null);
      setStep("otp");
      toast.success(data.message);
    } catch (err) {
      toast.error(apiError(err, "Could not send code."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LEN) return toast.error("Enter the 6-digit code.");
    setLoading(true);
    try {
      const data = await verifyForgotPasswordOtp(challengeToken, otp);
      setResetToken(data.reset_token);
      toast.success(data.message);
      setStep("reset_password");
    } catch (err) {
      toast.error(apiError(err, "Verification failed. Check the code."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      const data = await resetPasswordWithOtp(resetToken, newPassword);
      toast.success(data.message);
      switchMode("login");
    } catch (err) {
      toast.error(apiError(err, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "forgot"
      ? step === "credentials"
        ? "Forgot password"
        : step === "otp"
        ? "Enter verification code"
        : "Reset password"
      : step === "credentials"
      ? "Sign in"
      : "Enter verification code";

  return (
    <div className="min-h-screen bg-maroon-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-maroon-700">OBS PING</h1>
          <p className="text-sm text-gray-500 mt-1">The Observer</p>
          <p className="text-sm font-medium text-gray-800 mt-3">{title}</p>
        </div>

        {mode === "login" && step === "credentials" && (
          <form onSubmit={handleLoginCredentials} className="space-y-4">
            <div className="">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@observer.evsu.edu.ph" required autoComplete="email" />
            </div>
            <div className="relative">
              <label className="label">Password</label>
              <div className="relative mt-1">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-maroon-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending code…" : "Continue"}
            </button>
            <button type="button" className="text-sm text-maroon-700 hover:underline w-full text-center"
              onClick={() => switchMode("forgot")}>
              Forgot password?
            </button>
          </form>
        )}

        {mode === "login" && step === "otp" && (
          <form onSubmit={handleLoginOtp} className="space-y-4">
            <p className="text-xs text-gray-500 text-center">Code sent to <strong>{email}</strong></p>
            {devOtp && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                Dev code: <strong>{devOtp}</strong>
              </p>
            )}
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
            <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== OTP_LEN}>
              {loading ? "Verifying…" : "Sign in"}
            </button>
            <button type="button" className="text-sm text-gray-500 hover:underline w-full text-center"
              onClick={resetFlow} disabled={loading}>
              Back
            </button>
          </form>
        )}

        {mode === "forgot" && step === "credentials" && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <p className="text-xs text-gray-500"> we will email a verification code if this account exists.</p>
            <div className="">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@observer.evsu.edu.ph" required autoComplete="email" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending code…" : "Send verification code"}
            </button>
            <button type="button" className="text-sm text-maroon-700 hover:underline w-full text-center"
              onClick={() => switchMode("login")}>
              Back to sign in
            </button>
          </form>
        )}

        {mode === "forgot" && step === "otp" && (
          <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
            <p className="text-xs text-gray-500 text-center">Code sent to <strong>{email}</strong></p>
            {devOtp && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                Dev code: <strong>{devOtp}</strong>
              </p>
            )}
            <OtpInput value={otp} onChange={setOtp} disabled={loading} />
            <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== OTP_LEN}>
              {loading ? "Verifying…" : "Verify code"}
            </button>
            <button type="button" className="text-sm text-gray-500 hover:underline w-full text-center"
              onClick={resetFlow} disabled={loading}>
              Back
            </button>
          </form>
        )}

        {mode === "forgot" && step === "reset_password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-gray-500 text-center">Code verified. Enter your new password below.</p>
            <div className="relative">
              <label className="label">New password</label>
              <div className="relative mt-1">
                <input
                  className="input pr-10"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-maroon-700"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="relative">
              <label className="label">Confirm password</label>
              <div className="relative mt-1">
                <input
                  className="input pr-10"
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-maroon-700"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Updating…" : "Reset password"}
            </button>
            <button type="button" className="text-sm text-gray-500 hover:underline w-full text-center"
              onClick={() => setStep("otp")} disabled={loading}>
              Back to code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

