import { ensureMinimumRole } from "@/lib/auth";
import { pushFeedbackToJira } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await ensureMinimumRole(request, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { feedbackIds?: string[] };
  const feedbackIds = body.feedbackIds?.filter(Boolean) ?? [];

  if (!feedbackIds.length) {
    return Response.json({ error: "feedbackIds is required" }, { status: 400 });
  }

  try {
    const pushed = await pushFeedbackToJira(feedbackIds);
    return Response.json({ pushed, actorRole: auth.user?.role ?? null });
  } catch {
    return Response.json({ error: "Failed to push to Jira" }, { status: 500 });
  }
}
