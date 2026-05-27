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

  const resetFlow = () => {
    setStep("credentials");
    setOtp("");
    setChallengeToken("");
    setResetToken("");
    setDevOtp(null);
    setNewPassword("");
    setConfirmPassword("");
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
          <p className="text-sm text-gray-500 mt-1">The Observer — Task Management System</p>
          <p className="text-sm font-medium text-gray-800 mt-3">{title}</p>
        </div>

        {mode === "login" && step === "credentials" && (
          <form onSubmit={handleLoginCredentials} className="space-y-4">
            <div className="">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@observer.evsu.edu.ph" required autoComplete="email" />
            </div>
            <div className="">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" />
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
            <div className="">
              <label className="label">New password</label>
              <input className="input" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
            </div>
            <div className="">
              <label className="label">Confirm password</label>
              <input className="input" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
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

