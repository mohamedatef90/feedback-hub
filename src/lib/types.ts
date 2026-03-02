export type FeedbackCategory = "bug" | "feature" | "complaint" | "question";
export type FeedbackStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "blocked"
  | "done";

export type FeedbackItem = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  summary: string;
  source: "whatsapp" | "document" | "manual";
  category: FeedbackCategory;
  moduleTag: string;
  status: FeedbackStatus;
  priority: 1 | 2 | 3 | 4 | 5;
  owner: string;
  mentions: number;
  jiraKey?: string | null;
  aiConfidence?: number | null;
  needsReview?: boolean;
  createdAt: string;
};

export type FeedbackClusterSummary = {
  id: string;
  canonicalKey: string;
  summary: string;
  itemCount: number;
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "up" | "down";
};

export type ProjectSummary = {
  id: string;
  name: string;
  owner: string;
  totalComments: number;
  openItems: number;
  highPriority: number;
  lastUpdate: string;
};
