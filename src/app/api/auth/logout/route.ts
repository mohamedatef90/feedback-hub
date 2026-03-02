import { clearAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearAuthCookie(),
    },
  });
}
