"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackCategory, FeedbackStatus } from "@/lib/types";

type AddFeedbackFormProps = {
  projectId: string;
};

export function AddFeedbackForm({ projectId }: AddFeedbackFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [owner, setOwner] = useState("unassigned");
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [status, setStatus] = useState<FeedbackStatus>("new");
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [source, setSource] = useState<"whatsapp" | "document" | "manual">("manual");
  const [moduleTag, setModuleTag] = useState("general");
  const [mentions, setMentions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        summary,
        owner,
        category,
        status,
        priority,
        source,
        moduleTag,
        mentions,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to add feedback item");
      setLoading(false);
      return;
    }

    setTitle("");
    setSummary("");
    setMentions(1);
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="card p-6">
      <h2 className="text-xl font-semibold">Add Comment or Issue</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Log incoming feedback directly under this project.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm md:col-span-2"
        />
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Summary"
          rows={3}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm md:col-span-2"
        />
        <input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="Owner"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
        <input
          value={moduleTag}
          onChange={(event) => setModuleTag(event.target.value)}
          placeholder="Module tag"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="complaint">Complaint</option>
          <option value="question">Question</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeedbackStatus)}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          <option value="new">New</option>
          <option value="triaged">Triaged</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
        <select
          value={source}
          onChange={(event) => setSource(event.target.value as "whatsapp" | "document" | "manual")}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          <option value="manual">Manual</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="document">Document</option>
        </select>
        <input
          type="number"
          min={1}
          max={5}
          value={priority}
          onChange={(event) => setPriority(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          value={mentions}
          onChange={(event) => setMentions(Number(event.target.value) || 1)}
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
      >
        {loading ? "Saving..." : "Add Feedback"}
      </button>
    </form>
  );
}
