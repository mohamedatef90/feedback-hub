import { FeedbackStatus } from "@prisma/client";
import { ensureMinimumRole } from "@/lib/auth";
import { updateFeedbackWorkflow } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ feedbackId: string }>;
};

const isValidStatus = (value: string): value is FeedbackStatus =>
  ["new", "triaged", "in_progress", "blocked", "done"].includes(value);

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await ensureMinimumRole(request, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { feedbackId } = await context.params;
  const body = (await request.json()) as {
    status?: string;
    owner?: string;
    priority?: number;
  };

  if (body.status && !isValidStatus(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  if (body.priority !== undefined && (body.priority < 1 || body.priority > 5)) {
    return Response.json({ error: "Priority must be 1-5" }, { status: 400 });
  }

  const status = body.status && isValidStatus(body.status) ? body.status : undefined;

  try {
    const updated = await updateFeedbackWorkflow(feedbackId, {
      status,
      owner: body.owner,
      priority: body.priority,
    });

    return Response.json({ item: updated, actorRole: auth.user?.role ?? null });
  } catch {
    return Response.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}
