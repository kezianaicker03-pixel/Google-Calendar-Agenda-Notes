export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: "accepted" | "declined" | "tentative" | "needsAction" | string;
  isOrganizer?: boolean;
  isSelf?: boolean;
  optional?: boolean;
}

export interface MatchedDoc {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  modifiedTime?: string;
  snippet?: string;
  contentSummary?: string;
  fullText?: string;
  matchScore?: number;
}

export interface MeetingEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  startTime: string;
  endTime: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  isAllDay: boolean;
  durationMinutes: number;
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  attendees: CalendarAttendee[];
  matchedDocs: MatchedDoc[];
  isLoadingDocs?: boolean;
}

export interface CreatedDocResult {
  documentId: string;
  title: string;
  webViewLink: string;
  createdTime: string;
}

export type PipelineStep =
  | "auth"
  | "calendar"
  | "drive"
  | "synthesizing"
  | "ready"
  | "creating_doc"
  | "completed";
