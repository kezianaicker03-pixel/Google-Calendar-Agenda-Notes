import React from "react";
import { Calendar, HardDrive, FileText, CheckCircle2, Shield } from "lucide-react";

interface AuthCardProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onSignIn, isLoading, errorMessage }) => {
  return (
    <div className="max-w-2xl mx-auto my-8 bg-white border-4 border-black p-8 sm:p-12 text-left relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-8">
        <span className="text-xs font-black uppercase tracking-widest block mb-2 text-neutral-600">
          STATUS: AUTHENTICATION REQUIRED
        </span>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-black">
          Today<br />
          Meeting<br />
          Brief
        </h1>
        <p className="text-sm font-medium text-neutral-700 mt-4 leading-relaxed max-w-lg">
          Consolidate intelligence across your scheduled Google Calendar meetings, attendee rosters, and matching Google Drive documents into an executive briefing document.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border-2 border-black bg-neutral-50">
          <div className="text-2xl font-black mb-1">01</div>
          <h4 className="text-xs font-black uppercase tracking-wider text-black mb-1">
            Google Calendar
          </h4>
          <p className="text-[11px] font-medium text-neutral-600 leading-snug">
            Extracts scheduled events & attendee rosters
          </p>
        </div>

        <div className="p-4 border-2 border-black bg-neutral-50">
          <div className="text-2xl font-black mb-1">02</div>
          <h4 className="text-xs font-black uppercase tracking-wider text-black mb-1">
            Google Drive
          </h4>
          <p className="text-[11px] font-medium text-neutral-600 leading-snug">
            Scans docs matching meeting titles & notes
          </p>
        </div>

        <div className="p-4 border-2 border-black bg-neutral-50">
          <div className="text-2xl font-black mb-1">03</div>
          <h4 className="text-xs font-black uppercase tracking-wider text-black mb-1">
            Google Docs
          </h4>
          <p className="text-[11px] font-mono font-bold text-neutral-800 leading-snug">
            Today_Meeting_Brief.docx
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 border-2 border-black bg-red-100 text-black">
          <p className="text-xs font-black uppercase tracking-wider">ERROR // OAUTH FAILED</p>
          <p className="text-xs font-mono mt-1">{errorMessage}</p>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t-2 border-black">
        <button
          id="btn-google-signin"
          onClick={onSignIn}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white text-sm font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <span className="w-3 h-3 bg-white" />
          )}
          <span>{isLoading ? "CONNECTING..." : "CONNECT GOOGLE WORKSPACE"}</span>
        </button>

        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          OAUTH: CALENDAR • DRIVE • DOCS
        </div>
      </div>
    </div>
  );
};
