/**
 * SimpleMode — plain language, labeled buttons, quick task form, first-visit tour.
 */
import { createContext, useContext, useState, useCallback } from "react";

const MODE_KEY = "obs_ping_simple_mode";
const TOUR_KEY = "obs_ping_tour_done";

const SimpleModeContext = createContext(null);

function readSimpleMode() {
  const stored = localStorage.getItem(MODE_KEY);
  if (stored === null) return true; // default on for new users
  return stored === "true";
}

export function SimpleModeProvider({ children }) {
  const [simpleMode, setSimpleModeState] = useState(readSimpleMode);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem(TOUR_KEY));

  const setSimpleMode = useCallback((value) => {
    setSimpleModeState(value);
    localStorage.setItem(MODE_KEY, value ? "true" : "false");
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setShowTour(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setShowTour(true);
  }, []);

  return (
    <SimpleModeContext.Provider
      value={{ simpleMode, setSimpleMode, showTour, completeTour, restartTour }}
    >
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) throw new Error("useSimpleMode must be used within SimpleModeProvider");
  return ctx;
}
