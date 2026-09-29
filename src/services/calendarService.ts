import { MeetingEvent, CalendarAttendee } from "../types";

export interface DateRange {
  timeMin: string;
  timeMax: string;
  dateFormatted: string;
}

export function getTodayDateRange(selectedDate?: Date): DateRange {
  const date = selectedDate || new Date();
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

  return {
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    dateFormatted: date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

export async function fetchTodayCalendarMeetings(
  accessToken: string,
  selectedDate?: Date
): Promise<MeetingEvent[]> {
  const { timeMin, timeMax } = getTodayDateRange(selectedDate);
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.append("timeMin", timeMin);
  url.searchParams.append("timeMax", timeMax);
  url.searchParams.append("singleEvents", "true");
  url.searchParams.append("orderBy", "startTime");
  url.searchParams.append("maxResults", "250");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Calendar API error (${response.status}): Failed to retrieve scheduled events`
    );
  }

  const data = await response.json();
  const rawItems = data.items || [];

  return rawItems
    .filter((item: any) => item.status !== "cancelled")
    .map((item: any): MeetingEvent => {
      const isAllDay = !item.start?.dateTime && Boolean(item.start?.date);
      const startIso = item.start?.dateTime || item.start?.date || "";
      const endIso = item.end?.dateTime || item.end?.date || "";

      const startDate = new Date(startIso);
      const endDate = new Date(endIso);

      const startTimeFormatted = isAllDay
        ? "All Day"
        : startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      const endTimeFormatted = isAllDay
        ? "All Day"
        : endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      const durationMinutes = isAllDay
        ? 480
        : Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)));

      const organizer = item.organizer
        ? {
            email: item.organizer.email || "",
            displayName: item.organizer.displayName || item.organizer.email || "Organizer",
            self: item.organizer.self || false,
          }
        : undefined;

      const attendees: CalendarAttendee[] = (item.attendees || []).map((att: any) => ({
        email: att.email || "",
        displayName: att.displayName || att.email?.split("@")[0] || "Attendee",
        responseStatus: att.responseStatus || "needsAction",
        isOrganizer: att.organizer || (organizer?.email === att.email),
        isSelf: att.self || false,
        optional: att.optional || false,
      }));

      // If no attendees list on item but organizer exists, add organizer
      if (attendees.length === 0 && organizer?.email) {
        attendees.push({
          email: organizer.email,
          displayName: organizer.displayName,
          responseStatus: "accepted",
          isOrganizer: true,
          isSelf: organizer.self,
        });
      }

      return {
        id: item.id || `event-${Math.random().toString(36).substring(2, 9)}`,
        summary: item.summary?.trim() || "Untitled Meeting",
        description: item.description || "",
        location: item.location || "",
        hangoutLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri || "",
        startTime: startIso,
        endTime: endIso,
        startTimeFormatted,
        endTimeFormatted,
        isAllDay,
        durationMinutes,
        organizer,
        attendees,
        matchedDocs: [],
        isLoadingDocs: false,
      };
    });
}
