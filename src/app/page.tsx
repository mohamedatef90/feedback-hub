import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllFeedback, getProjects } from "@/lib/projects";
import { getSessionUser } from "@/lib/auth-session-server";

const toneStyle = {
  neutral: "text-[var(--muted)]",
  up: "text-[var(--ok)]",
  down: "text-[var(--danger)]",
} as const;

const statusStyle: Record<string, string> = {
  new: "bg-[#edf3ff] text-[#26427a] border-[#c5d7f7]",
  triaged: "bg-[#ecf8f5] text-[#1a6b4f] border-[#b8e4d5]",
  in_progress: "bg-[#eef6ff] text-[#0f4d92] border-[#b9d5f2]",
  blocked: "bg-[#fff4e5] text-[#9b5a06] border-[#f3d39f]",
  done: "bg-[#e8f8ee] text-[#1d7d4c] border-[#b9e4ca]",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const [projects, feedbackItems] = await Promise.all([
    getProjects(user),
    getAllFeedback(user),
  ]);

  const openItems = feedbackItems.filter((item) => item.status !== "done").length;
  const highPriority = feedbackItems.filter((item) => item.priority >= 4 && item.status !== "done").length;

  const metrics = [
    { label: "Open Items", value: String(openItems), delta: "Live", tone: "neutral" as const },
    {
      label: "High Priority",
      value: String(highPriority),
      delta: highPriority > 0 ? "Needs attention" : "Healthy",
      tone: highPriority > 0 ? ("down" as const) : ("up" as const),
    },
    { label: "Duplicate Rate", value: "N/A", delta: "Phase 5", tone: "neutral" as const },
    { label: "Time To Triage", value: "N/A", delta: "Phase 6", tone: "neutral" as const },
  ];

  const pipeline = [
    { label: "New", status: "new" },
    { label: "Triaged", status: "triaged" },
    { label: "In Progress", status: "in_progress" },
    { label: "Blocked", status: "blocked" },
    { label: "Done", status: "done" },
  ].map((stage) => ({
    ...stage,
    count: feedbackItems.filter((item) => item.status === stage.status).length,
  }));

  const total = feedbackItems.length || 1;
  const sourceMix = [
    { label: "WhatsApp", value: Math.round((feedbackItems.filter((item) => item.source === "whatsapp").length / total) * 100) },
    { label: "Docs", value: Math.round((feedbackItems.filter((item) => item.source === "document").length / total) * 100) },
    { label: "Manual", value: Math.round((feedbackItems.filter((item) => item.source === "manual").length / total) * 100) },
  ];

  const weeklyPulse = feedbackItems.length
    ? Math.min(95, Math.round((feedbackItems.filter((item) => item.status !== "new").length / feedbackItems.length) * 100))
    : 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="card overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div className="space-y-4">
            <span className="badge">Feedback Hub / Product Operations</span>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              One command center for every comment, message, and update.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
              Ingest WhatsApp exports, documents, and manual notes into one backlog.
              Deduplicate repeated issues, triage faster, and monitor delivery across teams.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/projects"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)]"
              >
                Open Projects Board
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-[#bdd6f5] bg-gradient-to-br from-[#134f93] to-[#0a2f5a] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-[#adc9ef]">Weekly Pulse</p>
            <p className="mt-3 text-3xl font-semibold">{weeklyPulse}%</p>
            <p className="mt-1 text-sm text-[#d4e5fa]">of incoming items moved beyond new status</p>
            <div className="mt-4 h-2 rounded-full bg-[#2f5f96]">
              <div className="h-2 rounded-full bg-[#7ad2d8]" style={{ width: `${weeklyPulse}%` }} />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="card p-5">
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
            <p className={`mt-3 text-sm ${toneStyle[metric.tone]}`}>{metric.delta}</p>
          </article>
        ))}
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Projects</h2>
          <span className="badge">Per project monitoring</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{project.id}</p>
                  <h3 className="mt-1 text-lg font-semibold">{project.name}</h3>
                </div>
                <span className="badge">Owner: {project.owner}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs text-[var(--muted)]">Comments</p>
                  <p className="text-2xl font-semibold">{project.totalComments}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs text-[var(--muted)]">Open</p>
                  <p className="text-2xl font-semibold">{project.openItems}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-alt)] p-3">
                  <p className="text-xs text-[var(--muted)]">P1/P2</p>
                  <p className="text-2xl font-semibold text-[var(--danger)]">{project.highPriority}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">Last update: {project.lastUpdate}</p>

              <div className="mt-4 space-y-2">
                {feedbackItems
                  .filter((item) => item.projectId === project.id)
                  .slice(0, 2)
                  .map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--line)] p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {item.id} | {item.mentions} comments | {item.status.replace("_", " ")}
                      </p>
                    </div>
                  ))}
              </div>
              <Link
                href={`/projects/${project.id}`}
                className="mt-4 inline-flex rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium hover:bg-[var(--surface-alt)]"
              >
                View full project
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Intake Pipeline</h2>
            <span className="badge">Updated today</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {pipeline.map((stage) => (
              <div key={stage.label} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{stage.label}</p>
                <p className="mt-2 text-3xl font-semibold">{stage.count}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Source Mix</h2>
            <span className="badge">Last 7 days</span>
          </div>
          <div className="space-y-4">
            {sourceMix.map((source) => (
              <div key={source.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{source.label}</span>
                  <span className="text-[var(--muted)]">{source.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#dce6f2]">
                  <div className="h-2 rounded-full bg-[var(--brand)]" style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">
            Recommendation: automate WhatsApp export parsing first. It is your largest intake channel.
          </div>
        </article>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Top Active Feedback Items</h2>
          <div className="flex gap-2">
            <button className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--surface-alt)]">
              Export CSV
            </button>
            <button className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)]">
              Create Jira Ticket
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-[var(--muted)]">
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Project</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Item</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Source</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Category</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Priority</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Status</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Owner</th>
                <th className="border-b border-[var(--line)] px-3 py-3 font-medium">Mentions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackItems.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">
                    {item.projectName}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top">
                    <p className="font-medium text-[var(--text)]">{item.title}</p>
                    <p className="mt-1 max-w-md text-[var(--muted)]">{item.summary}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {item.id} | {item.moduleTag} | {item.createdAt}
                    </p>
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top capitalize text-[var(--muted)]">
                    {item.source}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top capitalize text-[var(--muted)]">
                    {item.category}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top font-semibold">P{item.priority}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle[item.status]}`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top text-[var(--muted)]">{item.owner}</td>
                  <td className="border-b border-[var(--line)] px-3 py-4 align-top font-semibold">{item.mentions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="card p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold">Ingestion Connectors</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start with manual upload and exports, then attach live integrations as phase two.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { title: "WhatsApp Export", desc: "Upload .txt export from chat" },
              { title: "Document Intake", desc: "Upload DOCX, PDF, or TXT" },
              { title: "Quick Paste", desc: "Paste feedback from calls or meetings" },
            ].map((connector) => (
              <div key={connector.title} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <p className="font-medium">{connector.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{connector.desc}</p>
                <button className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-1.5 text-xs font-medium hover:bg-[#edf2f9]">
                  Configure
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="card p-6">
          <h2 className="text-xl font-semibold">System Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li>Core API scaffold is available under <code>src/app/api</code>.</li>
            <li>Database schema starter is available in <code>prisma/schema.prisma</code>.</li>
            <li>Next step is ingestion parsing (WhatsApp + docs) with deduplication.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
