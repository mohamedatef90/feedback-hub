import { UserRole } from "@prisma/client";
import { ensureMinimumRole, resolveRoleFromRequest } from "@/lib/auth";
import { addFeedbackNote } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ feedbackId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await ensureMinimumRole(request, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await resolveRoleFromRequest(request);
  const { feedbackId } = await context.params;
  const body = (await request.json()) as { author?: string; body?: string };

  const author = body.author?.trim();
  const noteBody = body.body?.trim();

  if (!author || !noteBody) {
    return Response.json({ error: "author and body are required" }, { status: 400 });
  }

  try {
    const note = await addFeedbackNote(feedbackId, {
      author,
      role: (role ?? "viewer") as UserRole,
      body: noteBody,
    });

    return Response.json({ note });
  } catch {
    return Response.json({ error: "Failed to add note" }, { status: 500 });
  }
}
