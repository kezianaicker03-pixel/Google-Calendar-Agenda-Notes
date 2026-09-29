import React from "react";
import { FileText, AlertCircle, Check, X, ShieldAlert } from "lucide-react";

interface DocCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  docTitle: string;
  onChangeDocTitle: (val: string) => void;
  meetingCount: number;
  isSubmitting: boolean;
}

export const DocCreationModal: React.FC<DocCreationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  docTitle,
  onChangeDocTitle,
  meetingCount,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black max-w-md w-full p-6 sm:p-8 text-left relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
            CONFIRM ACTION // EXPORT
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-black leading-tight">
            Create Google Doc
          </h3>
          <p className="text-xs font-mono uppercase text-neutral-600 mt-1">
            Saves briefing document into Google Drive root directory.
          </p>
        </div>

        <div className="space-y-4 my-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
              DOCUMENT FILE NAME
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => onChangeDocTitle(e.target.value)}
              className="w-full px-4 py-3 text-xs font-mono font-bold bg-neutral-50 border-2 border-black focus:outline-none focus:bg-white text-black"
              placeholder="Today_Meeting_Brief.docx"
            />
          </div>

          <div className="p-4 bg-neutral-100 border-2 border-black space-y-1.5 text-xs">
            <p className="font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span className="w-2 h-2 bg-black" />
              OPERATION PARAMETERS:
            </p>
            <ul className="space-y-1 text-neutral-700 font-mono text-[11px] uppercase">
              <li>• Creates new document in Google Drive</li>
              <li>• Writes compiled briefing for <strong>{meetingCount} meeting(s)</strong></li>
              <li>• Embedded attendee list and matching doc links</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-neutral-200 border-2 border-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            CANCEL
          </button>
          <button
            id="btn-confirm-create-doc"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !docTitle.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-black hover:bg-neutral-800 active:bg-neutral-900 border-2 border-black transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />
                <span>WRITING DOC...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>CONFIRM & WRITE DOC</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
