import { ensureMinimumRole } from "@/lib/auth";
import { getAlertSnapshot } from "@/lib/phase-services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await ensureMinimumRole(request, "pm");
  if (!auth.allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const snapshot = await getAlertSnapshot();
  return Response.json(snapshot);
}
