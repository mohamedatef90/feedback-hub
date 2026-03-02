import { ensureProjectRole } from "@/lib/auth";
import { isSupportedDocumentName, supportedDocumentExtensions, extractTextFromDocument } from "@/lib/document-parser";
import { ingestParsedEntries, parseDocumentText } from "@/lib/ingestion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const projectId = String(form.get("projectId") ?? "").trim();
  const uploadedBy = String(form.get("uploadedBy") ?? "").trim() || undefined;
  const file = form.get("file");

  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }
  const auth = await ensureProjectRole(request, projectId, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  if (!isSupportedDocumentName(file.name)) {
    return Response.json(
      { error: `Document upload supports: ${supportedDocumentExtensions.join(", ")}` },
      { status: 400 }
    );
  }

  let rawText = "";
  try {
    rawText = await extractTextFromDocument(file);
  } catch {
    return Response.json({ error: "Failed to parse uploaded file" }, { status: 400 });
  }

  const entries = parseDocumentText(rawText);

  try {
    const result = await ingestParsedEntries({
      projectId,
      sourceType: "document",
      fileName: file.name,
      uploadedBy,
      entries,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    return Response.json({ error: "Failed to ingest document file" }, { status: 500 });
  }
}
