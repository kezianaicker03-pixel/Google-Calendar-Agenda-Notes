import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Edit3,
  Eye,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  FileCheck2,
} from "lucide-react";

interface BriefingPreviewProps {
  outline: string;
  onChangeOutline: (text: string) => void;
  onSynthesize: () => void;
  onRequestCreateDoc: () => void;
  isSynthesizing: boolean;
  isCreatingDoc: boolean;
  docTitle: string;
}

export const BriefingPreview: React.FC<BriefingPreviewProps> = ({
  outline,
  onChangeOutline,
  onSynthesize,
  onRequestCreateDoc,
  isSynthesizing,
  isCreatingDoc,
  docTitle,
}) => {
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(outline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-4 border-black flex flex-col h-full relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Top action bar */}
      <div className="px-6 py-4 border-b-4 border-black bg-white flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-500">
            SYNTHESIZED INTEL
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black leading-tight">
            Meeting Brief Draft
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-neutral-700 mt-0.5">
            <span>TARGET:</span>
            <span className="bg-black text-white px-1.5 py-0.2">
              {docTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View / Edit Mode toggle */}
          <div className="flex items-center border-2 border-black bg-neutral-100 p-0.5 text-xs">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 px-3 py-1 font-black uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>PREVIEW</span>
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1 px-3 py-1 font-black uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                viewMode === "edit"
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>RAW TEXT</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-2 text-black hover:bg-black hover:text-white border-2 border-black transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title="Copy Outline"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            id="btn-resynthesize"
            onClick={onSynthesize}
            disabled={isSynthesizing || isCreatingDoc}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider text-black bg-neutral-100 hover:bg-black hover:text-white border-2 border-black transition-colors disabled:opacity-50 cursor-pointer"
            title="Re-synthesize notes with AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">REGENERATE</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-h-[600px] bg-neutral-50 relative">
        <div className="absolute top-0 right-0 px-3 py-1.5 border-l-2 border-b-2 border-black bg-white text-[10px] font-black uppercase tracking-widest">
          DOC_V1.0
        </div>

        {isSynthesizing ? (
          <div className="py-20 text-left space-y-4">
            <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin mb-4" />
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              SYNTHESIZING EXECUTIVE BRIEF...
            </h3>
            <p className="text-xs font-mono uppercase text-neutral-600 max-w-md">
              ANALYZING CALENDAR ATTENDEES & LINKING GOOGLE DRIVE DOCUMENTATION.
            </p>
          </div>
        ) : outline ? (
          viewMode === "preview" ? (
            <div className="prose prose-neutral max-w-none text-black text-sm leading-relaxed space-y-4">
              {outline.split("\n\n").map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black border-b-4 border-black pb-3">
                      {trimmed.replace("# ", "")}
                    </h1>
                  );
                } else if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-lg sm:text-xl font-black uppercase tracking-tight text-black mt-6 mb-3 border-b-2 border-black pb-2">
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                } else if (trimmed.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-base font-black uppercase tracking-wide text-black mt-4 mb-2">
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                } else if (trimmed.startsWith("#### ")) {
                  return (
                    <h4 key={idx} className="text-xs font-black uppercase tracking-widest text-neutral-600 mt-3 mb-1">
                      // {trimmed.replace("#### ", "")}
                    </h4>
                  );
                } else if (trimmed.startsWith("---")) {
                  return <hr key={idx} className="border-t-2 border-black my-6" />;
                } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  const items = trimmed.split("\n");
                  return (
                    <ul key={idx} className="space-y-1.5 text-black text-xs sm:text-sm font-medium">
                      {items.map((it, itIdx) => {
                        const cleanItem = it.replace(/^[-*]\s+/, "");
                        return (
                          <li key={itIdx} className="flex items-start gap-2.5 leading-snug">
                            <span className="w-1.5 h-1.5 bg-black mt-2 shrink-0" />
                            <span>{cleanItem}</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                } else {
                  return (
                    <p key={idx} className="text-xs sm:text-sm font-medium text-neutral-800 whitespace-pre-line leading-relaxed">
                      {trimmed}
                    </p>
                  );
                }
              })}
            </div>
          ) : (
            <textarea
              value={outline}
              onChange={(e) => onChangeOutline(e.target.value)}
              className="w-full h-full min-h-[420px] font-mono text-xs text-black p-4 bg-white border-2 border-black focus:outline-none focus:ring-0 resize-y"
              placeholder="Briefing outline content..."
            />
          )
        ) : (
          <div className="py-20 text-left border-2 border-dashed border-neutral-400 p-8">
            <p className="text-base font-black uppercase text-black">NO OUTLINE GENERATED</p>
            <p className="text-xs font-mono uppercase text-neutral-500 mt-1">
              Click regenerate or connect your calendar to synthesize intelligence.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-6 bg-neutral-100 border-t-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-black">
            READY FOR EXPORT // GOOGLE DOCS
          </div>
          <div className="text-[11px] font-mono uppercase text-neutral-600 mt-0.5">
            SAVES DIRECTLY TO YOUR ROOT GOOGLE DRIVE
          </div>
        </div>

        <button
          id="btn-create-google-doc"
          onClick={onRequestCreateDoc}
          disabled={!outline || isSynthesizing || isCreatingDoc}
          className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isCreatingDoc ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
              <span>SAVING TO GOOGLE DRIVE...</span>
            </>
          ) : (
            <>
              <span>SAVE TO GOOGLE DOCS</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
