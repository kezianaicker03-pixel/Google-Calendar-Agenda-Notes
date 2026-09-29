import { MatchedDoc, CreatedDocResult } from "../types";

/**
 * Extracts plain text from a Google Docs API document resource object
 */
export function extractTextFromGoogleDoc(docData: any): string {
  if (!docData || !docData.body || !docData.body.content) {
    return "";
  }

  const pieces: string[] = [];

  for (const structuralElement of docData.body.content) {
    if (structuralElement.paragraph) {
      for (const element of structuralElement.paragraph.elements || []) {
        if (element.textRun && element.textRun.content) {
          pieces.push(element.textRun.content);
        }
      }
    } else if (structuralElement.table) {
      for (const row of structuralElement.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellElement of cell.content || []) {
            if (cellElement.paragraph) {
              for (const elem of cellElement.paragraph.elements || []) {
                if (elem.textRun && elem.textRun.content) {
                  pieces.push(elem.textRun.content);
                }
              }
            }
          }
        }
      }
    }
  }

  return pieces.join("").trim();
}

/**
 * Clean and sanitize a meeting title into search queries
 */
function sanitizeSearchQueries(title: string): string[] {
  const clean = title.replace(/[^\w\s-]/g, " ").trim();
  const queries = new Set<string>();

  // Full title if reasonably sized
  if (clean.length > 2) {
    queries.add(clean);
  }

  // Remove common filler words
  const stripped = clean
    .replace(/\b(meeting|sync|weekly|daily|standup|1:1|catchup|call|discussion|review|chat)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length > 2 && stripped !== clean) {
    queries.add(stripped);
  }

  // Significant individual tokens
  const words = clean.split(/\s+/).filter((w) => w.length > 3);
  if (words.length > 0) {
    queries.add(words.join(" "));
  }

  return Array.from(queries);
}

/**
 * Search Google Drive for Google Docs matching the meeting title and fetch their content
 */
export async function searchDocsForMeeting(
  accessToken: string,
  meetingTitle: string
): Promise<MatchedDoc[]> {
  const queries = sanitizeSearchQueries(meetingTitle);
  const foundMap = new Map<string, MatchedDoc>();

  for (const qTerm of queries.slice(0, 2)) {
    // Escaping single quotes in Drive search queries
    const escapedTerm = qTerm.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
    
    // Search Google Docs files where name or fullText mentions query
    const qFilter = `mimeType = 'application/vnd.google-apps.document' and trashed = false and (name contains '${escapedTerm}' or fullText contains '${escapedTerm}')`;
    
    driveUrl.searchParams.append("q", qFilter);
    driveUrl.searchParams.append(
      "fields",
      "files(id, name, mimeType, webViewLink, modifiedTime, description)"
    );
    driveUrl.searchParams.append("pageSize", "5");
    driveUrl.searchParams.append("orderBy", "modifiedTime desc");

    try {
      const driveRes = await fetch(driveUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!driveRes.ok) {
        console.warn(`Drive search query failed (${driveRes.status}) for: "${qTerm}"`);
        continue;
      }

      const data = await driveRes.json();
      const files = data.files || [];

      for (const f of files) {
        if (!foundMap.has(f.id)) {
          foundMap.set(f.id, {
            id: f.id,
            name: f.name || "Untitled Google Doc",
            mimeType: f.mimeType,
            webViewLink: f.webViewLink || `https://docs.google.com/document/d/${f.id}/edit`,
            modifiedTime: f.modifiedTime,
            snippet: f.description || "",
            contentSummary: "",
            fullText: "",
          });
        }
      }
    } catch (err) {
      console.warn("Drive search error:", err);
    }
  }

  const results = Array.from(foundMap.values()).slice(0, 4);

  // Fetch content for each matched doc from Google Docs API
  await Promise.all(
    results.map(async (doc) => {
      try {
        const docsRes = await fetch(`https://docs.googleapis.com/v1/documents/${doc.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (docsRes.ok) {
          const docData = await docsRes.json();
          const extracted = extractTextFromGoogleDoc(docData);
          doc.fullText = extracted;
          doc.contentSummary =
            extracted.length > 500 ? extracted.substring(0, 500) + "..." : extracted;
        }
      } catch (docErr) {
        console.warn(`Failed to read content for doc ${doc.id}:`, docErr);
      }
    })
  );

  return results;
}

/**
 * Creates a new Google Doc named 'Today_Meeting_Brief.docx' (or specified title)
 * and populates it with the synthesized briefing outline.
 */
export async function createMeetingBriefDoc(
  accessToken: string,
  title: string = "Today_Meeting_Brief.docx",
  content: string
): Promise<CreatedDocResult> {
  // Step 1: Create the document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: title,
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errorBody.error?.message ||
        `Google Docs API error (${createRes.status}): Unable to create document`
    );
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Prepare formatted text content to insert
  const cleanBody = content.trim() + "\n\n---\n*Generated with Meeting Brief Workspace Integration*\n";

  // BatchUpdate request to insert text
  const batchRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: cleanBody,
            },
          },
        ],
      }),
    }
  );

  if (!batchRes.ok) {
    console.warn("Could not insert formatted text into Google Doc, doc was created empty");
  }

  return {
    documentId,
    title: doc.title || title,
    webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
    createdTime: new Date().toISOString(),
  };
}
