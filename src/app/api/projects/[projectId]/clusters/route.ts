import { ensureProjectRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const auth = await ensureProjectRole(_request, projectId, "viewer");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const clusters = await prisma.feedbackCluster.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          feedback: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              jiraKey: true,
            },
          },
        },
      },
    },
  });

  return Response.json({ clusters });
}
