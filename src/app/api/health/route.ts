import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    return Response.json(
      { status: "degraded", database: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
