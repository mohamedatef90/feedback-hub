import { FeedbackCategory, FeedbackStatus, SourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FeedbackItem } from "@/lib/types";

type ParsedInputEntry = {
  lineNumber: number;
  text: string;
  authorName?: string;
  messageTime?: Date;
};

type ClassifiedEntry = ParsedInputEntry & {
  title: string;
  category: FeedbackCategory;
  moduleTag: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: FeedbackStatus;
};

type IngestPayload = {
  projectId: string;
  sourceType: SourceType;
  fileName: string;
  uploadedBy?: string;
  ownerFallback?: string;
  entries: ParsedInputEntry[];
};

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

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
  createdAt: toDateOnly(item.createdAt),
});

const classifyText = (input: string): Omit<ClassifiedEntry, "lineNumber" | "text" | "authorName" | "messageTime"> => {
  const lower = input.toLowerCase();

  let category: FeedbackCategory = "question";
  if (/(fail|error|bug|issue|crash|broken)/.test(lower)) category = "bug";
  if (/(need|request|add|improve|feature)/.test(lower)) category = "feature";
  if (/(slow|bad|complain|unhappy|angry)/.test(lower)) category = "complaint";

  let moduleTag = "general";
  if (/(checkout|payment|invoice)/.test(lower)) moduleTag = "checkout";
  if (/(dashboard|report|analytics)/.test(lower)) moduleTag = "dashboard";
  if (/(login|permission|access|role)/.test(lower)) moduleTag = "access-control";

  let priority: 1 | 2 | 3 | 4 | 5 = 2;
  if (/(urgent|asap|critical|production)/.test(lower)) priority = 5;
  else if (/(high|important)/.test(lower)) priority = 4;
  else if (/(medium)/.test(lower)) priority = 3;

  return {
    title: input.slice(0, 72) || "Untitled feedback",
    category,
    moduleTag,
    priority,
    status: "new",
  };
};

const nextFeedbackIds = (existingIds: string[], count: number) => {
  const max = existingIds.reduce((acc, id) => {
    const numeric = Number(id.replace("FB-", ""));
    return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
  }, 1000);

  return Array.from({ length: count }, (_value, index) => `FB-${max + index + 1}`);
};

const parseDateSafe = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const parseWhatsAppText = (input: string): ParsedInputEntry[] => {
  const lines = input.split(/\r?\n/);
  const entries: ParsedInputEntry[] = [];

  const patterns = [
    /^\[(.+?)\]\s([^:]+):\s(.*)$/,
    /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)\s-\s([^:]+):\s(.*)$/,
  ];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (!line) {
      continue;
    }

    let matched = false;

    for (const pattern of patterns) {
      const capture = line.match(pattern);
      if (!capture) {
        continue;
      }

      const [, timeRaw, authorName, message] = capture;
      entries.push({
        lineNumber: i + 1,
        text: message.trim(),
        authorName: authorName.trim(),
        messageTime: parseDateSafe(timeRaw.trim()),
      });
      matched = true;
      break;
    }

    if (!matched) {
      const last = entries[entries.length - 1];
      if (last) {
        last.text = `${last.text}\n${line}`;
      }
    }
  }

  return entries.filter((entry) => entry.text.length >= 10).slice(0, 500);
};

export const parseDocumentText = (input: string): ParsedInputEntry[] =>
  input
    .split(/\r?\n+/)
    .map((line, index) => ({ lineNumber: index + 1, text: line.trim() }))
    .filter((entry) => entry.text.length >= 20)
    .slice(0, 500);

export const ingestParsedEntries = async (payload: IngestPayload) => {
  const entries = payload.entries
    .map((entry) => ({ ...entry, ...classifyText(entry.text) }))
    .filter((entry) => entry.text.length >= 10) as ClassifiedEntry[];

  if (!entries.length) {
    return { batchId: null, importedCount: 0, items: [] as FeedbackItem[] };
  }

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({ where: { id: payload.projectId } });
    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const existingFeedbackIds = await tx.feedbackItem.findMany({ select: { id: true } });
    const feedbackIds = nextFeedbackIds(
      existingFeedbackIds.map((item) => item.id),
      entries.length
    );

    const batch = await tx.ingestionBatch.create({
      data: {
        projectId: payload.projectId,
        sourceType: payload.sourceType,
        fileName: payload.fileName,
        uploadedBy: payload.uploadedBy,
      },
    });

    const createdItems: FeedbackItem[] = [];
    let totalMentions = 0;
    let openItems = 0;
    let highPriority = 0;

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const feedbackId = feedbackIds[index];
      totalMentions += 1;
      if (entry.status !== "done") {
        openItems += 1;
      }
      if (entry.priority >= 4) {
        highPriority += 1;
      }

      const created = await tx.feedbackItem.create({
        data: {
          id: feedbackId,
          projectId: payload.projectId,
          title: entry.title,
          summary: entry.text,
          source: payload.sourceType,
          category: entry.category,
          moduleTag: entry.moduleTag,
          status: entry.status,
          priority: entry.priority,
          owner: entry.authorName ?? payload.ownerFallback ?? "unassigned",
          mentions: 1,
        },
        include: {
          project: { select: { name: true } },
        },
      });

      await tx.ingestionEntry.create({
        data: {
          batchId: batch.id,
          lineNumber: entry.lineNumber,
          authorName: entry.authorName,
          messageTime: entry.messageTime,
          rawText: entry.text,
          feedbackItemId: created.id,
        },
      });

      createdItems.push(mapFeedback(created));
    }

    await tx.project.update({
      where: { id: payload.projectId },
      data: {
        totalComments: { increment: totalMentions },
        openItems: { increment: openItems },
        highPriority: { increment: highPriority },
        lastUpdate: new Date(),
      },
    });

    await tx.ingestionBatch.update({
      where: { id: batch.id },
      data: {
        importedCount: createdItems.length,
      },
    });

    return {
      batchId: batch.id,
      importedCount: createdItems.length,
      items: createdItems,
    };
  });
};
