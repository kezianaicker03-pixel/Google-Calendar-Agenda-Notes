import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Briefing synthesis endpoint
  app.post("/api/synthesize", async (req, res) => {
    try {
      const { meetings, todayDate, userName } = req.body;

      if (!meetings || !Array.isArray(meetings)) {
        res.status(400).json({ error: "Missing or invalid meetings list" });
        return;
      }

      const ai = getAI();
      if (!ai) {
        // Fallback rule-based structured briefing generation
        const fallbackBrief = generateFallbackOutline(meetings, todayDate, userName);
        res.json({ outline: fallbackBrief, source: "rule-based" });
        return;
      }

      const prompt = `You are an elite executive chief of staff and corporate intelligence assistant.
Your task is to synthesize today's scheduled meetings, their attendee lists, and relevant Google Docs notes found in Google Drive into a single, cohesive, high-impact executive briefing document.

Context for Today (${todayDate || "Today"}):
User/Account: ${userName || "User"}

Meetings & Context:
${meetings
  .map((m: any, index: number) => {
    const attendeesStr = (m.attendees || [])
      .map(
        (a: any) =>
          `  - ${a.displayName || a.email} (${a.responseStatus || "invited"}${a.isOrganizer ? ", Organizer" : ""}${a.isSelf ? ", Self" : ""})`
      )
      .join("\n");

    const docsStr = (m.matchedDocs || [])
      .map(
        (d: any) =>
          `  * Google Doc Title: "${d.name}"\n    Document Excerpt/Notes:\n${d.contentSummary || d.snippet || "No textual body available"}`
      )
      .join("\n\n");

    return `
### Meeting ${index + 1}: ${m.summary || "Untitled Meeting"}
- Time: ${m.startTimeFormatted} - ${m.endTimeFormatted} (${m.durationMinutes || 30} mins)
- Organizer: ${m.organizer?.displayName || m.organizer?.email || "Unknown"}
- Location/Meeting Link: ${m.location || m.hangoutLink || "No link specified"}
- Calendar Description: ${m.description || "None provided"}
- Attendees:
${attendeesStr || "  - No attendees listed"}
- Matched Google Docs from Drive:
${docsStr || "  - No related Google Docs found in Drive"}
`;
  })
  .join("\n----------------------------------------\n")}

Instructions for the Executive Briefing Outline:
1. Provide an overarching Executive Summary: Total meetings, total hours, core priorities for the day, and critical focal points.
2. For each meeting, produce a dedicated briefing block with:
   - Meeting Header (Time, Title, Organizer, Meet Link)
   - Attendees & Stakeholder Dynamics (who is attending, key stakeholders, status)
   - Background & Drive Docs Intelligence (synthesize key points from matched Google Docs and past notes)
   - Key Discussion Topics & Proposed Objectives
   - High-Value Questions to Ask / Action Items to drive
3. End with an "Action Items & Preparation Checklist" for the entire day.
4. Use clean, professional Markdown formatting with clear headers (#, ##, ###), bold points, and structured bullet lists. Make it ready to be exported into a formal Google Doc.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You write executive-ready, highly articulate briefing documents with actionable intelligence, clear stakeholder insights, and precise synthesis of existing meeting notes.",
        },
      });

      const text = response.text || generateFallbackOutline(meetings, todayDate, userName);
      res.json({ outline: text, source: "gemini-3.7-flash" });
    } catch (error: any) {
      console.error("Synthesis error:", error);
      res.status(500).json({
        error: error.message || "Failed to synthesize briefing outline",
        outline: generateFallbackOutline(req.body.meetings || [], req.body.todayDate, req.body.userName),
      });
    }
  });

  // Vite middleware in development vs static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function generateFallbackOutline(meetings: any[], todayDate?: string, userName?: string): string {
  const dateStr = todayDate || new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  if (meetings.length === 0) {
    return `# Today's Meeting Brief — ${dateStr}\n\n**Prepared for**: ${userName || "User"}\n\n## Executive Summary\nNo meetings scheduled for today in your Google Calendar. You have open focus time for deep work.\n`;
  }

  let text = `# Today's Meeting Brief — ${dateStr}\n\n`;
  text += `**Prepared for**: ${userName || "User"}\n\n`;
  text += `## 1. Executive Summary & Day Schedule\n`;
  text += `You have **${meetings.length} meeting(s)** scheduled for today.\n\n`;
  
  text += `### Schedule Snapshot\n`;
  meetings.forEach((m, idx) => {
    text += `- **${m.startTimeFormatted} - ${m.endTimeFormatted}**: ${m.summary || "Untitled"} (${m.durationMinutes || 30} mins)\n`;
  });
  text += `\n---\n\n`;

  text += `## 2. Detailed Meeting Briefings\n\n`;

  meetings.forEach((m, idx) => {
    text += `### Meeting ${idx + 1}: ${m.summary || "Untitled"}\n`;
    text += `- **Time**: ${m.startTimeFormatted} – ${m.endTimeFormatted}\n`;
    text += `- **Organizer**: ${m.organizer?.displayName || m.organizer?.email || "Unknown"}\n`;
    if (m.location || m.hangoutLink) {
      text += `- **Link / Location**: ${m.location || m.hangoutLink}\n`;
    }
    if (m.description) {
      text += `- **Calendar Notes**: ${m.description.replace(/\n+/g, " ")}\n`;
    }
    text += `\n`;

    // Attendees
    text += `#### Attendees (${(m.attendees || []).length})\n`;
    if (m.attendees && m.attendees.length > 0) {
      m.attendees.forEach((a: any) => {
        const status = a.responseStatus ? `[${a.responseStatus.toUpperCase()}]` : "";
        text += `- ${a.displayName || a.email} ${status} ${a.isOrganizer ? "(Organizer)" : ""}\n`;
      });
    } else {
      text += `- *No other attendees recorded on invite.*\n`;
    }
    text += `\n`;

    // Docs
    text += `#### Google Drive Context & Notes\n`;
    if (m.matchedDocs && m.matchedDocs.length > 0) {
      m.matchedDocs.forEach((d: any) => {
        text += `- **Doc**: [${d.name}](${d.webViewLink || "#"})\n`;
        if (d.contentSummary) {
          text += `  > ${d.contentSummary.substring(0, 300)}...\n`;
        }
      });
    } else {
      text += `- *No matching Google Docs found in Drive mentioning "${m.summary}".*\n`;
    }
    text += `\n`;

    text += `#### Key Discussion Points & Objectives\n`;
    text += `- Align on deliverables and strategic objectives for ${m.summary || "this discussion"}.\n`;
    text += `- Review any pending blockers, milestones, and next operational steps.\n\n`;

    text += `#### Suggested Action Items\n`;
    text += `- [ ] Record meeting takeaways and assign owners immediately post-call.\n`;
    text += `- [ ] Circulate follow-up notes with attendees.\n\n`;
    text += `---\n\n`;
  });

  text += `## 3. Daily Action Checklist\n`;
  text += `- [ ] Review briefing notes 5 minutes before each scheduled session.\n`;
  text += `- [ ] Follow up on action items captured during discussions.\n`;

  return text;
}

startServer();
