import React, { useState } from "react";
import { CreatedDocResult } from "../types";
import { CheckCircle2, ExternalLink, Copy, Check, FileText } from "lucide-react";

interface CreatedDocSuccessProps {
  result: CreatedDocResult;
  onDismiss: () => void;
}

export const CreatedDocSuccess: React.FC<CreatedDocSuccessProps> = ({ result, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(result.webViewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-emerald-100 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 text-black">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
              SUCCESS // SYNC COMPLETE
            </span>
            <span className="text-xs font-mono font-bold text-neutral-700">
              ID: {result.documentId}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            Google Doc Created & Saved
          </h3>
          <p className="text-xs font-mono font-bold text-neutral-800 mt-1">
            FILE NAME: <span className="bg-white px-2 py-0.5 border border-black">{result.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-neutral-100 border-2 border-black transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY LINK"}</span>
          </button>

          <a
            id="btn-open-google-doc"
            href={result.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-black hover:bg-neutral-800 active:bg-neutral-900 border-2 border-black transition-all"
          >
            <span>OPEN IN GOOGLE DOCS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
