import { FeedbackStatus } from "@prisma/client";
import { ensureMinimumRole } from "@/lib/auth";
import { getAllFeedback, getProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await ensureMinimumRole(request, "viewer");
  if (!auth.allowed || !auth.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [projects, feedback] = await Promise.all([getProjects(auth.user), getAllFeedback(auth.user)]);

  const openItems = feedback.filter((item) => item.status !== "done").length;
  const highPriority = feedback.filter((item) => item.priority >= 4 && item.status !== "done").length;

  const pipelineKeys: FeedbackStatus[] = ["new", "triaged", "in_progress", "blocked", "done"];
  const pipeline = pipelineKeys.map((status) => ({
    label: status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    count: feedback.filter((item) => item.status === status).length,
    status,
  }));

  const sourceCounts = {
    whatsapp: feedback.filter((item) => item.source === "whatsapp").length,
    document: feedback.filter((item) => item.source === "document").length,
    manual: feedback.filter((item) => item.source === "manual").length,
  };

  const total = feedback.length || 1;
  const sourceMix = [
    { label: "WhatsApp", value: Math.round((sourceCounts.whatsapp / total) * 100) },
    { label: "Docs", value: Math.round((sourceCounts.document / total) * 100) },
    { label: "Manual", value: Math.round((sourceCounts.manual / total) * 100) },
  ];

  const metrics = [
    { label: "Open Items", value: String(openItems), delta: "Live", tone: "neutral" },
    { label: "High Priority", value: String(highPriority), delta: "P1/P2", tone: highPriority > 0 ? "down" : "up" },
    { label: "Duplicate Rate", value: "N/A", delta: "Phase 5", tone: "neutral" },
    { label: "Time To Triage", value: "N/A", delta: "Phase 6", tone: "neutral" },
  ];

  return Response.json({
    metrics,
    projects,
    pipeline,
    sourceMix,
    topItems: feedback.slice(0, 25),
    generatedAt: new Date().toISOString(),
  });
}
