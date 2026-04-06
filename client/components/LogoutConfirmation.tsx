import React from 'react';

interface LogoutConfirmationProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirm: () => void;
  darkMode?: boolean;
}

export const LogoutConfirmation = ({ 
  isOpen, 
  isLoggingOut, 
  onClose, 
  onConfirm,
  darkMode = false 
}: LogoutConfirmationProps) => {
  if (!isOpen && !isLoggingOut) return null;

  const modalBg = darkMode ? "bg-slate-800 border border-slate-700" : "bg-white";
  const titleColor = darkMode ? "text-white" : "text-slate-900";
  const textColor = darkMode ? "text-slate-400" : "text-slate-500";
  const cancelBtn = darkMode 
    ? "border-slate-700 text-slate-300 hover:bg-slate-700" 
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  return (
    <>
      {/* Logout Confirmation Modal */}
      {isOpen && !isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className={`mx-auto w-full max-w-sm rounded-2xl p-6 shadow-xl ${modalBg}`}>
            <h3 className={`text-lg font-bold ${titleColor}`}>Confirm Logout</h3>
            <p className={`mt-2 text-sm ${textColor}`}>Are you sure you want to end your session?</p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={onClose} 
                className={`flex-1 rounded-xl border py-3 text-sm font-bold transition ${cancelBtn}`}
              >
                Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay (Smooth Transition) */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p className="mt-4 font-medium animate-pulse">Logging out...</p>
        </div>
      )}
    </>
  );
};
