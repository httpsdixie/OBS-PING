import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function MaintenancePage() {
  const [checking, setChecking] = useState(false);

  // Check if system is back online
  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || "/api") + "/auth/maintenance-status");
      if (res.data.maintenance_mode === false) {
        toast.success("ObsPing is back online! Redirecting...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error("System is still under maintenance. Please try again later.");
      }
    } catch (err) {
      toast.error("Unable to reach the server. Please check your connection.");
    } finally {
      setChecking(false);
    }
  };

  // Auto-check every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get((import.meta.env.VITE_API_URL || "/api") + "/auth/maintenance-status");
        if (res.data.maintenance_mode === false) {
          window.location.href = "/login";
        }
      } catch (e) {
        // Silent catch for auto-check
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium background styling */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-maroon-900/20 via-slate-950 to-slate-950 z-0"></div>
      
      {/* Decorative gradient glow bubbles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-maroon-800/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] animate-pulse delay-700"></div>

      {/* Glassmorphic Container */}
      <div className="relative z-10 max-w-md w-full bg-slate-900/60 border border-slate-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center space-y-6 transform hover:scale-[1.01] transition-all duration-300">
        
        {/* Gear / Construction Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-maroon-700 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-maroon-900/30">
          <svg className="w-10 h-10 text-white animate-[spin_8s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            System Under Maintenance
          </h1>
          <div className="h-0.5 w-24 bg-gradient-to-r from-maroon-700 to-amber-600 mx-auto rounded-full"></div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed">
          ObsPing is temporarily under maintenance while our editors polish the gears. All staff and editor accounts are locked until upgrades are complete. Please check back soon!
        </p>

        {/* Action Button */}
        <div className="pt-4">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-700 hover:to-maroon-600 disabled:from-maroon-900 disabled:to-maroon-900 disabled:text-slate-400 border border-maroon-700/30 hover:border-maroon-600/50 shadow-lg shadow-maroon-950/40 hover:shadow-maroon-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking Status...
              </>
            ) : (
              "Try Again"
            )}
          </button>
        </div>

        {/* Backdoor indicator */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">
            ObsPing Publisher System
          </p>
          <button
            onClick={() => {
              sessionStorage.setItem("admin_bypass", "true");
              window.location.href = "/login";
            }}
            className="text-[11px] text-slate-500 hover:text-maroon-400 hover:underline transition-colors mt-2"
          >
            EIC & Administration Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
