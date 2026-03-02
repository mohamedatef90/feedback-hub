"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, owner }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to create project");
      setLoading(false);
      return;
    }

    setName("");
    setOwner("");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card p-5">
      <h2 className="text-lg font-semibold">Create Project</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Add a new project to start tracking its comments.</p>

      <div className="mt-4 grid gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
        <input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Owner email"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
