import { FeedbackCategory, FeedbackStatus, SourceType } from "@prisma/client";
import { ensureProjectRole } from "@/lib/auth";
import {
  createFeedbackForProject,
  getProjectById,
  getProjectFeedback,
  getProjectStatusCounts,
} from "@/lib/projects";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

const isValidCategory = (value: string): value is FeedbackCategory =>
  ["bug", "feature", "complaint", "question"].includes(value);

const isValidStatus = (value: string): value is FeedbackStatus =>
  ["new", "triaged", "in_progress", "blocked", "done"].includes(value);

const isValidSource = (value: string): value is SourceType =>
  ["whatsapp", "document", "manual"].includes(value);

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await ensureProjectRole(_request, projectId, "viewer");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const project = await getProjectById(auth.user, projectId);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({
    project,
    statusCounts: await getProjectStatusCounts(auth.user, projectId),
    feedback: await getProjectFeedback(auth.user, projectId),
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await ensureProjectRole(request, projectId, "pm");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as {
    title?: string;
    summary?: string;
    owner?: string;
    category?: string;
    status?: string;
    priority?: number;
    source?: string;
    moduleTag?: string;
    mentions?: number;
  };

  const title = body.title?.trim();
  const summary = body.summary?.trim();
  const owner = body.owner?.trim();
  const moduleTag = body.moduleTag?.trim();
  const category = body.category ?? "question";
  const status = body.status ?? "new";
  const source = body.source ?? "manual";
  const priority = body.priority ?? 3;
  const mentions = body.mentions ?? 1;

  if (!title || !summary || !owner || !moduleTag) {
    return Response.json(
      { error: "title, summary, owner, and moduleTag are required" },
      { status: 400 }
    );
  }

  if (!isValidCategory(category) || !isValidStatus(status) || !isValidSource(source)) {
    return Response.json({ error: "invalid category/status/source" }, { status: 400 });
  }

  if (priority < 1 || priority > 5) {
    return Response.json({ error: "priority must be between 1 and 5" }, { status: 400 });
  }

  let item = null;
  try {
    item = await createFeedbackForProject(
      projectId,
      {
        title,
        summary,
        owner,
        category,
        status,
        priority: priority as 1 | 2 | 3 | 4 | 5,
        source,
        moduleTag,
        mentions,
      },
      auth.user
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Failed to create feedback item" }, { status: 500 });
  }

  if (!item) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({ item }, { status: 201 });
}
