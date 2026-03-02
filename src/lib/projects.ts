import {
  FeedbackCategory,
  FeedbackStatus,
  Project,
  SourceType,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { type AuthUser } from "@/lib/auth";
import { FeedbackClusterSummary, FeedbackItem, ProjectSummary } from "@/lib/types";

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const mapProject = (project: Project): ProjectSummary => ({
  id: project.id,
  name: project.name,
  owner: project.owner,
  totalComments: project.totalComments,
  openItems: project.openItems,
  highPriority: project.highPriority,
  lastUpdate: toDateOnly(project.lastUpdate),
});

const mapFeedback = (
  item: {
    id: string;
    title: string;
    summary: string;
    source: SourceType;
    category: FeedbackCategory;
    moduleTag: string;
    status: FeedbackStatus;
    priority: number;
    owner: string;
    mentions: number;
    jiraKey: string | null;
    aiConfidence: number | null;
    needsReview: boolean;
    createdAt: Date;
    projectId: string;
    project: { name: string };
  }
): FeedbackItem => ({
  id: item.id,
  projectId: item.projectId,
  projectName: item.project.name,
  title: item.title,
  summary: item.summary,
  source: item.source,
  category: item.category,
  moduleTag: item.moduleTag,
  status: item.status,
  priority: item.priority as 1 | 2 | 3 | 4 | 5,
  owner: item.owner,
  mentions: item.mentions,
  jiraKey: item.jiraKey,
  aiConfidence: item.aiConfidence,
  needsReview: item.needsReview,
  createdAt: toDateOnly(item.createdAt),
});

const nextIdFromRows = (prefix: string, ids: string[], pad = 3) => {
  const max = ids.reduce((acc, id) => {
    const numeric = Number(id.replace(`${prefix}-`, ""));
    return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
  }, 0);

  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
};

const canSeeAllProjects = (user: AuthUser | null) => user?.role === "admin";

const projectAccessWhere = (user: AuthUser | null) =>
  canSeeAllProjects(user)
    ? {}
    : user
      ? {
          members: {
            some: {
              userId: user.id,
            },
          },
        }
      : { id: "__none__" };

const roleRank: Record<UserRole, number> = {
  viewer: 1,
  pm: 2,
  admin: 3,
};

export const getProjects = async (user: AuthUser | null): Promise<ProjectSummary[]> => {
  const projects = await prisma.project.findMany({
    where: projectAccessWhere(user),
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(mapProject);
};

export const getProjectById = async (
  user: AuthUser | null,
  projectId: string
): Promise<ProjectSummary | null> => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessWhere(user),
    },
  });
  return project ? mapProject(project) : null;
};

export const getProjectFeedback = async (
  user: AuthUser | null,
  projectId: string
): Promise<FeedbackItem[]> => {
  const feedback = await prisma.feedbackItem.findMany({
    where: {
      projectId,
      project: projectAccessWhere(user),
    },
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return feedback.map(mapFeedback);
};

export const getProjectStatusCounts = async (user: AuthUser | null, projectId: string) => {
  const baseline: Record<FeedbackStatus, number> = {
    new: 0,
    triaged: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  };

  const grouped = await prisma.feedbackItem.groupBy({
    by: ["status"],
    where: {
      projectId,
      project: projectAccessWhere(user),
    },
    _count: { status: true },
  });

  for (const row of grouped) {
    baseline[row.status] = row._count.status;
  }

  return baseline;
};

export const getAllFeedback = async (user: AuthUser | null): Promise<FeedbackItem[]> => {
  const feedback = await prisma.feedbackItem.findMany({
    where: {
      project: projectAccessWhere(user),
    },
    include: { project: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return feedback.map(mapFeedback);
};

export const getProjectIngestionBatches = async (
  user: AuthUser | null,
  projectId: string
): Promise<
  Array<{
    id: string;
    sourceType: SourceType;
    fileName: string;
    uploadedBy: string | null;
    importedCount: number;
    createdAt: string;
  }>
> => {
  const batches = await prisma.ingestionBatch.findMany({
    where: {
      projectId,
      project: projectAccessWhere(user),
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return batches.map((batch) => ({
    id: batch.id,
    sourceType: batch.sourceType,
    fileName: batch.fileName,
    uploadedBy: batch.uploadedBy,
    importedCount: batch.importedCount,
    createdAt: toDateOnly(batch.createdAt),
  }));
};

export const getProjectClusters = async (
  user: AuthUser | null,
  projectId: string
): Promise<FeedbackClusterSummary[]> => {
  const clusters = await prisma.feedbackCluster.findMany({
    where: {
      projectId,
      project: projectAccessWhere(user),
    },
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return clusters.map((cluster) => ({
    id: cluster.id,
    canonicalKey: cluster.canonicalKey,
    summary: cluster.summary,
    itemCount: cluster._count.items,
  }));
};

export const createProject = async (payload: { name: string; owner: string }, creator: AuthUser) => {
  const ids = await prisma.project.findMany({ select: { id: true } });
  const id = nextIdFromRows(
    "PRJ",
    ids.map((project) => project.id)
  );

  const project = await prisma.project.create({
    data: {
      id,
      name: payload.name,
      owner: payload.owner,
      createdById: creator.id,
      members: {
        create: {
          userId: creator.id,
          role: creator.role === "viewer" ? "pm" : creator.role,
        },
      },
    },
  });

  return mapProject(project);
};

export const createFeedbackForProject = async (
  projectId: string,
  payload: {
    title: string;
    summary: string;
    owner: string;
    category: FeedbackCategory;
    status: FeedbackStatus;
    priority: 1 | 2 | 3 | 4 | 5;
    source: SourceType;
    moduleTag: string;
    mentions?: number;
  },
  actor?: AuthUser
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: actor
        ? {
            where: {
              userId: actor.id,
            },
            select: {
              role: true,
            },
          }
        : false,
    },
  });
  if (!project) {
    return null;
  }

  if (actor && actor.role !== "admin") {
    const membership = project.members[0];
    if (!membership || roleRank[membership.role] < roleRank.pm) {
      throw new Error("FORBIDDEN");
    }
  }

  const ids = await prisma.feedbackItem.findMany({ select: { id: true } });
  const feedbackId = nextIdFromRows(
    "FB",
    ids.map((item) => item.id),
    4
  );

  const mentions = payload.mentions ?? 1;

  const [item] = await prisma.$transaction([
    prisma.feedbackItem.create({
      data: {
        id: feedbackId,
        projectId,
        title: payload.title,
        summary: payload.summary,
        owner: payload.owner,
        category: payload.category,
        status: payload.status,
        priority: payload.priority,
        source: payload.source,
        moduleTag: payload.moduleTag,
        mentions,
      },
      include: { project: { select: { name: true } } },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        totalComments: { increment: mentions },
        openItems: { increment: payload.status === "done" ? 0 : 1 },
        highPriority: { increment: payload.priority >= 4 ? 1 : 0 },
        lastUpdate: new Date(),
      },
    }),
  ]);

  return mapFeedback(item);
};
