import { ensureMinimumRole } from "@/lib/auth";
import { createProject, getProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await ensureMinimumRole(request, "viewer");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getProjects(auth.user);
  return Response.json({
    projects,
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const auth = await ensureMinimumRole(request, "pm");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; owner?: string };

  const name = body.name?.trim();
  const owner = body.owner?.trim();

  if (!name || !owner) {
    return Response.json({ error: "name and owner are required" }, { status: 400 });
  }

  const project = await createProject({ name, owner }, auth.user);

  return Response.json({ project }, { status: 201 });
}
