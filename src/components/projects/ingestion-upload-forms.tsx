"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type IngestionUploadFormsProps = {
  projectId: string;
};

type UploadState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

const initialState: UploadState = {
  loading: false,
  message: null,
  error: null,
};

export function IngestionUploadForms({ projectId }: IngestionUploadFormsProps) {
  const router = useRouter();
  const [uploadedBy, setUploadedBy] = useState("");
  const [whatsAppState, setWhatsAppState] = useState<UploadState>(initialState);
  const [docState, setDocState] = useState<UploadState>(initialState);

  const uploadFile = async (
    event: FormEvent<HTMLFormElement>,
    endpoint: "/api/ingest/whatsapp-upload" | "/api/ingest/document-upload",
    setState: (state: UploadState) => void
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setState({ loading: false, message: null, error: "Please choose a file." });
      return;
    }

    const payload = new FormData();
    payload.set("projectId", projectId);
    payload.set("file", file);
    if (uploadedBy.trim()) {
      payload.set("uploadedBy", uploadedBy.trim());
    }

    setState({ loading: true, message: null, error: null });

    const response = await fetch(endpoint, {
      method: "POST",
      body: payload,
    });

    const result = (await response.json()) as {
      error?: string;
      importedCount?: number;
      batchId?: string;
    };

    if (!response.ok) {
      setState({
        loading: false,
        message: null,
        error: result.error ?? "Upload failed",
      });
      return;
    }

    const imported = result.importedCount ?? 0;
    setState({
      loading: false,
      message: `Imported ${imported} item(s). Batch: ${result.batchId ?? "n/a"}`,
      error: null,
    });
    form.reset();
    router.refresh();
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="card p-6">
        <h2 className="text-xl font-semibold">Import WhatsApp Export</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Upload official WhatsApp chat export in `.txt` format.</p>

        <label className="mt-4 block text-sm text-[var(--muted)]">
          Uploaded by
          <input
            value={uploadedBy}
            onChange={(event) => setUploadedBy(event.target.value)}
            placeholder="your@email.com"
            className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
        </label>

        <form
          className="mt-3"
          onSubmit={(event) => uploadFile(event, "/api/ingest/whatsapp-upload", setWhatsAppState)}
        >
          <input
            name="file"
            type="file"
            accept=".txt"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={whatsAppState.loading}
            className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            {whatsAppState.loading ? "Importing..." : "Import WhatsApp"}
          </button>
        </form>

        {whatsAppState.message ? <p className="mt-3 text-sm text-[var(--ok)]">{whatsAppState.message}</p> : null}
        {whatsAppState.error ? <p className="mt-3 text-sm text-[var(--danger)]">{whatsAppState.error}</p> : null}
      </article>

      <article className="card p-6">
        <h2 className="text-xl font-semibold">Import Document Feedback</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Upload `.txt`, `.md`, `.csv`, `.log`, `.docx`, or `.pdf` to extract feedback lines.</p>

        <form
          className="mt-6"
          onSubmit={(event) => uploadFile(event, "/api/ingest/document-upload", setDocState)}
        >
          <input
            name="file"
            type="file"
            accept=".txt,.md,.csv,.log,.docx,.pdf"
            className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={docState.loading}
            className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            {docState.loading ? "Importing..." : "Import Document"}
          </button>
        </form>

        {docState.message ? <p className="mt-3 text-sm text-[var(--ok)]">{docState.message}</p> : null}
        {docState.error ? <p className="mt-3 text-sm text-[var(--danger)]">{docState.error}</p> : null}
      </article>
    </section>
  );
}
