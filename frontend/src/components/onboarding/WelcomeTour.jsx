/**
 * WelcomeTour — short first-login walkthrough (Simple mode).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSimpleMode } from "../../context/SimpleModeContext";
import { useAuth } from "../../context/AuthContext";

const STEPS = [
  {
    title: "Welcome to OBS PING 👋",
    body: "This app shows your work for The Observer. We'll give you a quick tour — it only takes a minute.",
  },
  {
    title: "Start on Home",
    body: "Your dashboard shows what's due and what needs your attention. Look for the big red button when something is waiting for you.",
    route: "/dashboard",
  },
  {
    title: "Open your tasks",
    body: "Tap Tasks in the menu to see everything assigned to you. Tap any card to open it and take action.",
    route: "/tasks",
  },
  {
    title: "You're ready!",
    body: "Simple mode is on — plain words and labeled buttons. Toggle it anytime from the top bar. Ask your head if you get stuck.",
  },
];

export default function WelcomeTour() {
  const { showTour, completeTour } = useSimpleMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  if (!showTour || !user) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (current.route) navigate(current.route);
    if (isLast) {
      completeTour();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <p className="text-xs text-maroon-700 font-medium">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{current.body}</p>
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={completeTour}>
            Skip tour
          </button>
          <button type="button" className="btn-primary flex-1" onClick={goNext}>
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}