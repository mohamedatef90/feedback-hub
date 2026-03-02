import { FeedbackStatus, IntegrationStatus, UserRole } from "@prisma/client";
import { type AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join("-");

const inferPriority = (text: string) => {
  const lower = text.toLowerCase();
  if (/(urgent|critical|production|outage)/.test(lower)) return 5;
  if (/(high|important|blocking)/.test(lower)) return 4;
  if (/(medium)/.test(lower)) return 3;
  return 2;
};

const inferConfidence = (text: string) => {
  const lengthBoost = Math.min(0.35, text.length / 400);
  const signalBoost = /(error|bug|feature|slow|request)/i.test(text) ? 0.3 : 0.1;
  return Math.min(0.95, 0.35 + lengthBoost + signalBoost);
};

export const runAiProcessingForProject = async (projectId: string) => {
  const run = await prisma.aIProcessingRun.create({
    data: { projectId, status: "running" },
  });

  try {
    const items = await prisma.feedbackItem.findMany({ where: { projectId } });

    let processedCount = 0;
    let clusterCount = 0;

    for (const item of items) {
      const canonical = normalizeKey(`${item.title} ${item.summary}`);
      const confidence = inferConfidence(item.summary);
      const suggestedPriority = inferPriority(item.summary);

      const cluster = await prisma.feedbackCluster.upsert({
        where: { projectId_canonicalKey: { projectId, canonicalKey: canonical } },
        update: {
          summary: item.title,
          updatedAt: new Date(),
        },
        create: {
          projectId,
          canonicalKey: canonical,
          summary: item.title,
        },
      });

      await prisma.feedbackClusterItem.upsert({
        where: {
          clusterId_feedbackId: {
            clusterId: cluster.id,
            feedbackId: item.id,
          },
        },
        update: {},
        create: {
          clusterId: cluster.id,
          feedbackId: item.id,
        },
      });

      await prisma.feedbackItem.update({
        where: { id: item.id },
        data: {
          aiConfidence: confidence,
          needsReview: confidence < 0.6,
          priority: Math.max(item.priority, suggestedPriority),
        },
      });

      processedCount += 1;
    }

    clusterCount = await prisma.feedbackCluster.count({ where: { projectId } });

    await prisma.aIProcessingRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        processedCount,
        clusterCount,
      },
    });

    return { runId: run.id, processedCount, clusterCount };
  } catch (error) {
    await prisma.aIProcessingRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
};

export const updateFeedbackWorkflow = async (
  feedbackId: string,
  payload: { status?: FeedbackStatus; owner?: string; priority?: number }
) => {
  const updated = await prisma.feedbackItem.update({
    where: { id: feedbackId },
    data: {
      status: payload.status,
      owner: payload.owner,
      priority: payload.priority,
    },
  });

  return updated;
};

export const addFeedbackNote = async (
  feedbackId: string,
  payload: { author: string; role: UserRole; body: string }
) => {
  return prisma.feedbackNote.create({
    data: {
      feedbackId,
      author: payload.author,
      role: payload.role,
      body: payload.body,
    },
  });
};

export const pushFeedbackToJira = async (feedbackIds: string[]) => {
  const results: Array<{ feedbackId: string; jiraKey: string }> = [];

  for (const feedbackId of feedbackIds) {
    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const jiraKey = `FBH-${ticketNumber}`;

    await prisma.$transaction([
      prisma.feedbackItem.update({
        where: { id: feedbackId },
        data: { jiraKey },
      }),
      prisma.integrationEvent.create({
        data: {
          feedbackId,
          provider: "jira",
          status: IntegrationStatus.sent,
          externalId: jiraKey,
          message: "Simulated push to Jira",
        },
      }),
    ]);

    results.push({ feedbackId, jiraKey });
  }

  return results;
};

export const getProjectReport = async (user: AuthUser, projectId: string) => {
  const projectAccessWhere =
    user.role === "admin"
      ? { id: projectId }
      : { id: projectId, members: { some: { userId: user.id } } };

  const [project, items, clusters, aiRuns] = await Promise.all([
    prisma.project.findFirst({ where: projectAccessWhere }),
    prisma.feedbackItem.findMany({
      where: user.role === "admin" ? { projectId } : { projectId, project: { members: { some: { userId: user.id } } } },
    }),
    prisma.feedbackCluster.findMany({
      where: user.role === "admin" ? { projectId } : { projectId, project: { members: { some: { userId: user.id } } } },
    }),
    prisma.aIProcessingRun.findMany({
      where: user.role === "admin" ? { projectId } : { projectId, project: { members: { some: { userId: user.id } } } },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  if (!project) return null;

  const byStatus = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const overdue = items.filter((item) => item.status !== "done" && item.priority >= 4).length;

  return {
    project,
    kpis: {
      total: items.length,
      open: items.filter((item) => item.status !== "done").length,
      highPriority: items.filter((item) => item.priority >= 4).length,
      needsReview: items.filter((item) => item.needsReview).length,
      overdue,
      clusters: clusters.length,
    },
    byStatus,
    recentAiRuns: aiRuns,
  };
};

export const getAlertSnapshot = async () => {
  const [openHighPriority, staleRuns] = await Promise.all([
    prisma.feedbackItem.count({ where: { priority: { gte: 4 }, status: { not: "done" } } }),
    prisma.aIProcessingRun.count({ where: { status: "failed" } }),
  ]);

  return {
    severity: openHighPriority > 10 || staleRuns > 0 ? "warning" : "normal",
    openHighPriority,
    failedAiRuns: staleRuns,
    generatedAt: new Date().toISOString(),
  };
};
