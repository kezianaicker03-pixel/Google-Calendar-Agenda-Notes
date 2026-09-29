import React from "react";
import { User } from "firebase/auth";
import { Calendar, FileText, Sparkles, LogOut, CheckCircle2, RefreshCw } from "lucide-react";

interface HeaderProps {
  user: User | null;
  todayFormatted: string;
  onRefresh: () => void;
  onLogout: () => void;
  isProcessing: boolean;
  meetingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  todayFormatted,
  onRefresh,
  onLogout,
  isProcessing,
  meetingCount,
}) => {
  return (
    <header className="border-b-4 border-black bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-black text-sm">
              WI
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.3em] uppercase text-black">
                Workspace Intelligence // 2026
              </div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-neutral-600 mt-0.5 flex items-center gap-2">
                <span>{todayFormatted}</span>
                {meetingCount > 0 && (
                  <span className="bg-black text-white px-1.5 py-0.2 text-[10px] font-black">
                    {meetingCount} {meetingCount === 1 ? "EVENT" : "EVENTS"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[11px] font-black tracking-[0.2em] uppercase bg-black text-white px-3 py-1 border border-black">
                  CONNECTED: GOOGLE SUITE
                </span>
                <div className={`w-3 h-3 rounded-full ${isProcessing ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} title={isProcessing ? "Processing..." : "Connected"} />
              </div>

              <button
                id="btn-refresh-calendar"
                onClick={onRefresh}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white border-2 border-black transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh Calendar & Drive Search"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">REFRESH</span>
              </button>

              <div className="flex items-center gap-2 pl-1 border-l-2 border-black ml-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 border-2 border-black object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-black">
                    {user.displayName?.[0] || user.email?.[0] || "U"}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-black leading-tight uppercase truncate max-w-[120px]">
                    {user.displayName || "Account"}
                  </p>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={onLogout}
                className="p-1.5 text-black hover:bg-black hover:text-white border-2 border-black transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-500">
                OFFLINE
              </span>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
