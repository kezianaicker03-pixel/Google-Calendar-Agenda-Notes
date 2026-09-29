import React, { useState } from "react";
import { MeetingEvent, MatchedDoc } from "../types";
import {
  Clock,
  Users,
  Video,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  CheckCircle,
  Clock3,
  HelpCircle,
  XCircle,
  FileSearch,
} from "lucide-react";

interface MeetingTimelineProps {
  meetings: MeetingEvent[];
  isSearchingDrive: boolean;
  onPreviewDoc?: (doc: MatchedDoc) => void;
}

export const MeetingTimeline: React.FC<MeetingTimelineProps> = ({
  meetings,
  isSearchingDrive,
  onPreviewDoc,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    meetings.length > 0 ? meetings[0].id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
            ACCEPTED
          </span>
        );
      case "tentative":
        return (
          <span className="bg-neutral-200 text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-black">
            TENTATIVE
          </span>
        );
      case "declined":
        return (
          <span className="bg-red-500 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
            DECLINED
          </span>
        );
      default:
        return (
          <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-neutral-400">
            INVITED
          </span>
        );
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="border-4 border-black p-8 text-left bg-neutral-50">
        <div className="text-3xl font-black uppercase mb-2">00 // NO EVENTS</div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">
          No meetings scheduled for today on Google Calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting, index) => {
        const isExpanded = expandedId === meeting.id;
        const indexStr = String(index + 1).padStart(2, "0");
        const acceptedCount = meeting.attendees.filter((a) => a.responseStatus === "accepted").length;

        return (
          <div
            key={meeting.id}
            id={`meeting-card-${meeting.id}`}
            className={`border-4 border-black transition-all bg-white ${
              isExpanded ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" : "hover:border-black"
            }`}
          >
            {/* Main Header */}
            <div
              onClick={() => toggleExpand(meeting.id)}
              className="p-5 cursor-pointer flex items-start justify-between gap-4 select-none bg-white"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl sm:text-4xl font-black shrink-0 tracking-tighter text-black leading-none">
                  {indexStr}
                </div>

                <div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-1 flex items-center gap-2">
                    <span>CALENDAR EVENT</span>
                    <span>•</span>
                    <span className="text-black font-mono font-bold">
                      {meeting.startTimeFormatted} – {meeting.endTimeFormatted}
                    </span>
                    {meeting.isAllDay && (
                      <span className="bg-black text-white px-1.5 py-0.2 text-[9px] font-black">
                        ALL DAY
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-black leading-tight uppercase tracking-tight">
                    {meeting.summary}
                  </h3>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="bg-neutral-100 px-2 py-1 text-[10px] font-bold border border-black uppercase text-black">
                      {meeting.attendees.length} ATTENDEES ({acceptedCount} CONFIRMED)
                    </span>

                    {meeting.matchedDocs.length > 0 ? (
                      <span className="bg-black text-white px-2 py-1 text-[10px] font-bold border border-black uppercase">
                        {meeting.matchedDocs.length} DRIVE DOC{meeting.matchedDocs.length === 1 ? "" : "S"} FOUND
                      </span>
                    ) : isSearchingDrive ? (
                      <span className="bg-amber-100 text-black px-2 py-1 text-[10px] font-bold border border-black uppercase animate-pulse">
                        SCANNING DRIVE...
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-neutral-400">
                        NO DRIVE NOTES
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {meeting.hangoutLink && (
                  <a
                    href={meeting.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-2.5 py-1 text-[10px] font-black uppercase bg-black text-white hover:bg-neutral-800 border border-black"
                    title="Video Call Link"
                  >
                    MEET
                  </a>
                )}
                <button
                  type="button"
                  className="p-1 text-black font-black"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="p-5 border-t-4 border-black bg-neutral-50 space-y-5">
                {/* Description if present */}
                {meeting.description && (
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-black mb-1">
                      AGENDA / CALENDAR NOTES
                    </div>
                    <p className="text-xs font-mono text-neutral-800 bg-white p-3 border-2 border-black whitespace-pre-line leading-relaxed">
                      {meeting.description}
                    </p>
                  </div>
                )}

                {/* Attendee List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-black">
                      ATTENDEES ROSTER ({meeting.attendees.length})
                    </div>
                    {meeting.organizer && (
                      <span className="text-[10px] font-mono font-bold uppercase text-neutral-600">
                        ORGANIZER: {meeting.organizer.displayName || meeting.organizer.email}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {meeting.attendees.map((att, attIdx) => (
                      <div
                        key={attIdx}
                        className="flex items-center justify-between p-2.5 bg-white border-2 border-black text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-black uppercase truncate text-[11px]">
                            {att.displayName || att.email}
                            {att.isOrganizer && (
                              <span className="ml-1 text-[9px] bg-black text-white px-1 py-0.2">HOST</span>
                            )}
                            {att.isSelf && (
                              <span className="ml-1 text-[9px] bg-neutral-200 text-black px-1 py-0.2">YOU</span>
                            )}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-500 truncate">{att.email}</p>
                        </div>
                        {getStatusBadge(att.responseStatus)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matched Google Docs from Drive */}
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-black mb-2 flex items-center justify-between">
                    <span>MATCHED GOOGLE DOCS ({meeting.matchedDocs.length})</span>
                    <span className="text-[10px] text-neutral-500 uppercase">DRIVE SEARCH</span>
                  </div>

                  {meeting.matchedDocs.length > 0 ? (
                    <div className="space-y-2">
                      {meeting.matchedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-white border-2 border-black"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-black uppercase tracking-tight text-black truncate">
                                {doc.name}
                              </span>
                            </div>
                            <a
                              href={doc.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-black text-white hover:bg-neutral-800 border border-black shrink-0 inline-flex items-center gap-1"
                            >
                              <span>OPEN IN DRIVE</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {doc.contentSummary && (
                            <p className="text-[11px] font-mono text-neutral-700 mt-2 bg-neutral-100 p-2 border border-black italic leading-snug">
                              "{doc.contentSummary}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white border-2 border-black text-left">
                      <p className="text-xs font-mono text-neutral-600">
                        NO GOOGLE DOCS MATCHING "{meeting.summary.toUpperCase()}" FOUND IN DRIVE.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
