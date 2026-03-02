import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddFeedbackForm } from "@/components/projects/add-feedback-form";
import { IngestionUploadForms } from "@/components/projects/ingestion-upload-forms";
import { ProjectPhaseActions } from "@/components/projects/project-phase-actions";
import { getSessionUser } from "@/lib/auth-session-server";
import {
  getProjectById,
  getProjectClusters,
  getProjectFeedback,
  getProjectIngestionBatches,
  getProjectStatusCounts,
} from "@/lib/projects";

const statusLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const project = await getProjectById(user, projectId);

  if (!project) {
    notFound();
  }

  const [feedback, statusCounts, ingestionBatches, clusters] = await Promise.all([
    getProjectFeedback(user, projectId),
    getProjectStatusCounts(user, projectId),
    getProjectIngestionBatches(user, projectId),
    getProjectClusters(user, projectId),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="badge">{project.id}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{project.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Project owner: {project.owner}</p>
          </div>
          <Link href="/projects" className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium">
            Back to Projects
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-5">
        {Object.entries(statusCounts).map(([key, value]) => (
          <article key={key} className="card p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{statusLabels[key]}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>

      <AddFeedbackForm projectId={projectId} />
      <ProjectPhaseActions projectId={projectId} feedback={feedback} />
      <IngestionUploadForms projectId={projectId} />

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Duplicate Clusters (Phase 5)</h2>
          <span className="badge">{clusters.length} clusters</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {clusters.map((cluster) => (
            <article key={cluster.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{cluster.canonicalKey}</p>
              <p className="mt-1 font-medium">{cluster.summary}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">{cluster.itemCount} linked item(s)</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Recent Imports</h2>
          <span className="badge">{ingestionBatches.length} batches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-[var(--muted)]">
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Batch</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Source</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">File</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Uploaded By</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Imported</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {ingestionBatches.map((batch) => (
                <tr key={batch.id} className="text-sm">
                  <td className="border-b border-[var(--line)] px-3 py-3">{batch.id}</td>
                  <td className="border-b border-[var(--line)] px-3 py-3 capitalize">{batch.sourceType}</td>
                  <td className="border-b border-[var(--line)] px-3 py-3">{batch.fileName}</td>
                  <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--muted)]">
                    {batch.uploadedBy ?? "n/a"}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-3 font-semibold">{batch.importedCount}</td>
                  <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--muted)]">{batch.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Project Comments and Issues</h2>
          <span className="badge">{feedback.length} tracked items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-[var(--muted)]">
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Item</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Source</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Category</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Priority</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Status</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Owner</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Mentions</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">AI</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Jira</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top">
                    <p className="font-medium text-[var(--text)]">{item.title}</p>
                    <p className="mt-1 max-w-md text-[var(--muted)]">{item.summary}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {item.id} | {item.moduleTag} | {item.createdAt}
                    </p>
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top capitalize text-[var(--muted)]">{item.source}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top capitalize text-[var(--muted)]">{item.category}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top font-semibold">P{item.priority}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">{item.status.replace("_", " ")}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">{item.owner}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top font-semibold">{item.mentions}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">
                    {item.aiConfidence ? `${Math.round(item.aiConfidence * 100)}%` : "n/a"}
                    {item.needsReview ? " (review)" : ""}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">{item.jiraKey ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
