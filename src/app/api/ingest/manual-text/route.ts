import { ensureProjectRole } from "@/lib/auth";
import { parseDocumentText, ingestParsedEntries } from "@/lib/ingestion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
    projectId?: string;
    uploadedBy?: string;
  };
  const text = body.text?.trim();

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const parsedEntries = parseDocumentText(text);

  if (body.projectId) {
    const auth = await ensureProjectRole(request, body.projectId, "pm");
    if (!auth.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const result = await ingestParsedEntries({
        projectId: body.projectId,
        sourceType: "manual",
        fileName: "manual-input.txt",
        uploadedBy: body.uploadedBy,
        entries: parsedEntries,
      });

      return Response.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      return Response.json({ error: "Failed to persist manual ingestion" }, { status: 500 });
    }
  }

  return Response.json({
    importedCount: parsedEntries.length,
    items: parsedEntries,
  });
}
