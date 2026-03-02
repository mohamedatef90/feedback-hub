"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackItem } from "@/lib/types";

type ProjectPhaseActionsProps = {
  projectId: string;
  feedback: FeedbackItem[];
};

export function ProjectPhaseActions({ projectId, feedback }: ProjectPhaseActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"ai" | "jira" | "report" | null>(null);

  const pushCandidates = useMemo(
    () => feedback.filter((item) => item.priority >= 4 && !item.jiraKey).slice(0, 10),
    [feedback]
  );

  const runAi = async () => {
    setLoading("ai");
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/ai/projects/${projectId}/process`, { method: "POST" });
    const payload = (await response.json()) as { error?: string; processedCount?: number; clusterCount?: number };

    if (!response.ok) {
      setError(payload.error ?? "AI processing failed");
      setLoading(null);
      return;
    }

    setMessage(`AI processed ${payload.processedCount ?? 0} items and built ${payload.clusterCount ?? 0} clusters.`);
    setLoading(null);
    router.refresh();
  };

  const pushJira = async () => {
    setLoading("jira");
    setError(null);
    setMessage(null);

    const response = await fetch("/api/integrations/jira/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackIds: pushCandidates.map((item) => item.id) }),
    });

    const payload = (await response.json()) as { error?: string; pushed?: Array<{ jiraKey: string }> };

    if (!response.ok) {
      setError(payload.error ?? "Jira push failed");
      setLoading(null);
      return;
    }

    setMessage(`Pushed ${payload.pushed?.length ?? 0} item(s) to Jira.`);
    setLoading(null);
    router.refresh();
  };

  const fetchReport = async () => {
    setLoading("report");
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/reports/projects/${projectId}`);
    const payload = (await response.json()) as { error?: string; kpis?: { open: number; highPriority: number; clusters: number } };

    if (!response.ok) {
      setError(payload.error ?? "Failed to fetch report");
      setLoading(null);
      return;
    }

    setMessage(
      `Report: open ${payload.kpis?.open ?? 0}, high-priority ${payload.kpis?.highPriority ?? 0}, clusters ${payload.kpis?.clusters ?? 0}.`
    );
    setLoading(null);
  };

  return (
    <section className="card p-6">
      <h2 className="text-xl font-semibold">Phase Actions</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Run AI processing, trigger Jira sync for critical items, and fetch project reports.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={runAi}
          disabled={loading !== null}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
        >
          {loading === "ai" ? "Running AI..." : "Run AI Processing"}
        </button>
        <button
          onClick={pushJira}
          disabled={loading !== null || pushCandidates.length === 0}
          className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--surface-alt)] disabled:opacity-60"
        >
          {loading === "jira" ? "Pushing..." : `Push ${pushCandidates.length} to Jira`}
        </button>
        <button
          onClick={fetchReport}
          disabled={loading !== null}
          className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--surface-alt)] disabled:opacity-60"
        >
          {loading === "report" ? "Loading..." : "Fetch Project Report"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-[var(--ok)]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </section>
  );
}
