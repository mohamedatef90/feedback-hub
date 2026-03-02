import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, serializeAuthCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return Response.json({ error: "email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(user);

  return new Response(JSON.stringify({ user: { id: user.id, email: user.email, role: user.globalRole } }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": serializeAuthCookie(token),
    },
  });
}
