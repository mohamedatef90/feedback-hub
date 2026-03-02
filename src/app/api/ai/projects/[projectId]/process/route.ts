import { ensureProjectRole } from "@/lib/auth";
import { runAiProcessingForProject } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await ensureProjectRole(request, projectId, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runAiProcessingForProject(projectId);
    return Response.json({ ...result, actorRole: auth.user?.role ?? null });
  } catch {
    return Response.json({ error: "Failed to run AI processing" }, { status: 500 });
  }
}
