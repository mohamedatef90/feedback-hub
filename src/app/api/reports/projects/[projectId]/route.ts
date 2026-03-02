import { ensureMinimumRole } from "@/lib/auth";
import { getProjectReport } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await ensureMinimumRole(_request, "viewer");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const report = await getProjectReport(auth.user, projectId);

  if (!report) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(report);
}
