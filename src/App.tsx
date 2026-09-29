import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { MeetingEvent, MatchedDoc, CreatedDocResult } from "./types";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from "./services/firebaseAuth";
import {
  fetchTodayCalendarMeetings,
  getTodayDateRange,
} from "./services/calendarService";
import {
  searchDocsForMeeting,
  createMeetingBriefDoc,
} from "./services/driveDocsService";
import { Header } from "./components/Header";
import { AuthCard } from "./components/AuthCard";
import { MeetingTimeline } from "./components/MeetingTimeline";
import { BriefingPreview } from "./components/BriefingPreview";
import { DocCreationModal } from "./components/DocCreationModal";
import { CreatedDocSuccess } from "./components/CreatedDocSuccess";
import {
  Calendar,
  Sparkles,
  HardDrive,
  FileText,
  AlertCircle,
  Play,
  Layers,
  Clock,
  Users,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Workflow states
  const [meetings, setMeetings] = useState<MeetingEvent[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [isSearchingDrive, setIsSearchingDrive] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [outline, setOutline] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Doc creation
  const [docTitle, setDocTitle] = useState<string>("Today_Meeting_Brief.docx");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocResult, setCreatedDocResult] = useState<CreatedDocResult | null>(null);

  const { dateFormatted } = getTodayDateRange();

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        // Automatically start searching today's meetings once signed in
        runFullPipeline(result.accessToken, result.user);
      }
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setAuthError(err.message || "Failed to sign in with Google Workspace");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setMeetings([]);
    setOutline("");
    setCreatedDocResult(null);
  };

  /**
   * Runs the full workflow:
   * 1. Fetches today's meetings from Google Calendar
   * 2. Searches Google Drive for Google Docs matching each meeting title
   * 3. Synthesizes a comprehensive briefing outline
   */
  const runFullPipeline = useCallback(
    async (tokenParam?: string | null, activeUser?: User | null) => {
      setErrorMessage(null);
      setCreatedDocResult(null);
      const token = tokenParam || (await getAccessToken());

      if (!token) {
        setNeedsAuth(true);
        return;
      }

      const currentUser = activeUser || user;

      try {
        // Step 1: Fetch Google Calendar meetings for today
        setIsLoadingMeetings(true);
        const todayMeetings = await fetchTodayCalendarMeetings(token);
        setMeetings(todayMeetings);
        setIsLoadingMeetings(false);

        // Step 2: Search Google Drive for Google Docs matching each meeting
        setIsSearchingDrive(true);
        const meetingsWithDocs: MeetingEvent[] = [];

        for (const m of todayMeetings) {
          const matchedDocs = await searchDocsForMeeting(token, m.summary);
          meetingsWithDocs.push({
            ...m,
            matchedDocs,
          });
        }
        setMeetings(meetingsWithDocs);
        setIsSearchingDrive(false);

        // Step 3: Synthesize Briefing Outline
        setIsSynthesizing(true);
        await synthesizeBriefing(meetingsWithDocs, currentUser?.displayName || "User");
        setIsSynthesizing(false);
      } catch (err: any) {
        console.error("Workflow error:", err);
        setErrorMessage(err.message || "An unexpected error occurred during processing");
        setIsLoadingMeetings(false);
        setIsSearchingDrive(false);
        setIsSynthesizing(false);
      }
    },
    [user]
  );

  /**
   * Calls the server-side synthesis route (using Gemini 3.7 Flash)
   */
  const synthesizeBriefing = async (currentMeetings: MeetingEvent[], userName: string) => {
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetings: currentMeetings,
          todayDate: dateFormatted,
          userName: userName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Synthesis API error (${res.status})`);
      }

      const data = await res.json();
      setOutline(data.outline || "");
    } catch (err: any) {
      console.warn("Falling back to local synthesis:", err);
      // Fallback local synthesis if offline or server endpoint hiccup
      setOutline(generateLocalOutline(currentMeetings, userName));
    }
  };

  const generateLocalOutline = (meetingList: MeetingEvent[], userName: string): string => {
    if (meetingList.length === 0) {
      return `# Today's Meeting Brief — ${dateFormatted}\n\n**Prepared for**: ${userName}\n\n## Executive Summary\nNo meetings scheduled in your Google Calendar for today. Your calendar is open for focused individual work.\n`;
    }

    let doc = `# Today's Meeting Brief — ${dateFormatted}\n\n`;
    doc += `**Prepared for**: ${userName}\n\n`;
    doc += `## 1. Executive Summary & Schedule Overview\n`;
    doc += `You have **${meetingList.length} meeting(s)** scheduled for today across your primary Google Calendar.\n\n`;

    meetingList.forEach((m, idx) => {
      doc += `### Meeting ${idx + 1}: ${m.summary}\n`;
      doc += `- **Time**: ${m.startTimeFormatted} - ${m.endTimeFormatted} (${m.durationMinutes} minutes)\n`;
      doc += `- **Organizer**: ${m.organizer?.displayName || m.organizer?.email || "Unknown"}\n`;
      if (m.location || m.hangoutLink) {
        doc += `- **Location / Video Link**: ${m.location || m.hangoutLink}\n`;
      }
      if (m.description) {
        doc += `- **Calendar Agenda**: ${m.description.replace(/\n+/g, " ")}\n`;
      }
      doc += `\n`;

      doc += `#### Attendees (${m.attendees.length})\n`;
      m.attendees.forEach((a) => {
        const role = a.isOrganizer ? " (Organizer)" : a.isSelf ? " (You)" : "";
        doc += `- ${a.displayName || a.email} [${a.responseStatus?.toUpperCase() || "INVITED"}]${role}\n`;
      });
      doc += `\n`;

      doc += `#### Matched Google Docs from Drive\n`;
      if (m.matchedDocs.length > 0) {
        m.matchedDocs.forEach((d) => {
          doc += `- **Doc Title**: ${d.name} (${d.webViewLink})\n`;
          if (d.contentSummary) {
            doc += `  > Excerpt: "${d.contentSummary.substring(0, 250)}..."\n`;
          }
        });
      } else {
        doc += `- *No related Google Docs found in Drive matching "${m.summary}".*\n`;
      }
      doc += `\n`;

      doc += `#### Key Discussion Focus & Objectives\n`;
      doc += `- Align on deliverables, key updates, and next milestone decisions.\n`;
      doc += `- Clarify action item ownership and follow-through timelines.\n\n`;
      doc += `---\n\n`;
    });

    doc += `## 2. Daily Action Items Checklist\n`;
    doc += `- [ ] Review briefing notes prior to meetings\n`;
    doc += `- [ ] Capture discussion action items and assign follow-ups\n`;

    return doc;
  };

  /**
   * User confirms creation of the Google Doc
   */
  const handleConfirmCreateDoc = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsCreatingDoc(true);
    try {
      const result = await createMeetingBriefDoc(token, docTitle, outline);
      setCreatedDocResult(result);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to create Google Doc:", err);
      setErrorMessage(err.message || "Failed to create Google Doc in Drive");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Auto-run if user is authenticated and hasn't fetched meetings yet
  useEffect(() => {
    if (user && meetings.length === 0 && !isLoadingMeetings && !isSearchingDrive && !isSynthesizing) {
      runFullPipeline();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      <Header
        user={user}
        todayFormatted={dateFormatted}
        onRefresh={() => runFullPipeline()}
        onLogout={handleLogout}
        isProcessing={isLoadingMeetings || isSearchingDrive || isSynthesizing}
        meetingCount={meetings.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {needsAuth ? (
          <AuthCard
            onSignIn={handleSignIn}
            isLoading={isLoggingIn}
            errorMessage={authError}
          />
        ) : (
          <div className="space-y-8">
            {/* Created Google Doc success banner if present */}
            {createdDocResult && (
              <CreatedDocSuccess
                result={createdDocResult}
                onDismiss={() => setCreatedDocResult(null)}
              />
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="p-6 bg-red-100 border-4 border-black flex items-start justify-between gap-4 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 inline-block mb-1">
                    SYSTEM ERROR
                  </div>
                  <h4 className="text-base font-black uppercase text-black">Workspace Pipeline Error</h4>
                  <p className="text-xs font-mono uppercase text-neutral-800 mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-3 py-1 text-xs font-black uppercase bg-black text-white hover:bg-neutral-800 border border-black cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Pipeline progress banner */}
            {(isLoadingMeetings || isSearchingDrive || isSynthesizing) && (
              <div className="bg-neutral-100 border-4 border-black p-5 flex items-center justify-between gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-none animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase text-black">
                      {isLoadingMeetings
                        ? "QUERYING GOOGLE CALENDAR FOR TODAY'S SCHEDULE..."
                        : isSearchingDrive
                        ? "SCANNING GOOGLE DRIVE FOR MATCHING GOOGLE DOCS..."
                        : "SYNTHESIZING EXECUTIVE BRIEF WITH AI..."}
                    </p>
                    <p className="text-[10px] font-mono uppercase text-neutral-600">
                      SYNCHRONIZING CALENDAR • DRIVE • DOCS
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                  <span className={isLoadingMeetings ? "bg-black text-white px-2 py-0.5" : "text-neutral-400"}>
                    01. CALENDAR
                  </span>
                  <span>→</span>
                  <span className={isSearchingDrive ? "bg-black text-white px-2 py-0.5" : "text-neutral-400"}>
                    02. DRIVE
                  </span>
                  <span>→</span>
                  <span className={isSynthesizing ? "bg-black text-white px-2 py-0.5" : "text-neutral-400"}>
                    03. BRIEF
                  </span>
                </div>
              </div>
            )}

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Meetings & Drive Matches */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border-b-4 border-black pb-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block">
                      SOURCE INTEL
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-black leading-none mt-1">
                      Today's Meetings ({meetings.length})
                    </h2>
                  </div>

                  <button
                    onClick={() => runFullPipeline()}
                    disabled={isLoadingMeetings || isSearchingDrive}
                    className="text-xs font-black uppercase tracking-wider text-black underline hover:bg-black hover:text-white px-2 py-1 transition-colors cursor-pointer"
                  >
                    REFRESH
                  </button>
                </div>

                <MeetingTimeline
                  meetings={meetings}
                  isSearchingDrive={isSearchingDrive}
                />
              </div>

              {/* Right Column: Synthesized Briefing Preview & Google Doc Generator */}
              <div className="lg:col-span-7">
                <BriefingPreview
                  outline={outline}
                  onChangeOutline={setOutline}
                  onSynthesize={() => synthesizeBriefing(meetings, user.displayName || "User")}
                  onRequestCreateDoc={() => setIsModalOpen(true)}
                  isSynthesizing={isSynthesizing}
                  isCreatingDoc={isCreatingDoc}
                  docTitle={docTitle}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <DocCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmCreateDoc}
        docTitle={docTitle}
        onChangeDocTitle={setDocTitle}
        meetingCount={meetings.length}
        isSubmitting={isCreatingDoc}
      />
    </div>
  );
}
