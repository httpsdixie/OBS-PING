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
  const simpleMode = false;
  const showTour = false;

  const setSimpleMode = useCallback(() => {}, []);
  const completeTour = useCallback(() => {}, []);
  const restartTour = useCallback(() => {}, []);

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
