import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { getSessionUser } from "@/lib/auth-session-server";
import { getProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const projects = await getProjects(user);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="card p-6 md:p-8">
        <p className="badge">Projects / Portfolio Monitoring</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Projects Overview</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)] md:text-base">
          Monitor each project with total comments, active issues, high-priority risk, and direct drill-down.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="card p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{project.id}</p>
              <h2 className="mt-1 text-xl font-semibold">{project.name}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Owner: {project.owner}</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[var(--muted)]">Comments</p>
                  <p className="text-2xl font-semibold">{project.totalComments}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[var(--muted)]">Open</p>
                  <p className="text-2xl font-semibold">{project.openItems}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs text-[var(--muted)]">P1/P2</p>
                  <p className="text-2xl font-semibold text-[var(--danger)]">{project.highPriority}</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-[var(--muted)]">Last update: {project.lastUpdate}</p>
              <Link
                href={`/projects/${project.id}`}
                className="mt-4 inline-flex rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)]"
              >
                Open Project
              </Link>
            </article>
          ))}
        </div>

        <CreateProjectForm />
      </section>
    </main>
  );
}
