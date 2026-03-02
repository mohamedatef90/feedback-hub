import { jwtVerify, SignJWT } from "jose";
import { ProjectMember, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "feedback_hub_session";

type SessionPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

const roleRank: Record<UserRole, number> = {
  viewer: 1,
  pm: 2,
  admin: 3,
};

const getSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return "local-dev-auth-secret-change-me";
    }
    throw new Error("AUTH_SECRET is required in production");
  }
  return secret;
};

const secretKey = () => new TextEncoder().encode(getSecret());

const parseCookie = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const createSessionToken = async (user: { id: string; email: string; globalRole: UserRole }) => {
  return new SignJWT({ email: user.email, role: user.globalRole })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
};

export const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;

    if (typeof sub !== "string" || typeof email !== "string") {
      return null;
    }

    if (role !== "admin" && role !== "pm" && role !== "viewer") {
      return null;
    }

    return {
      sub,
      email,
      role,
    };
  } catch {
    return null;
  }
};

export const getSessionPayloadFromRequest = async (request: Request) => {
  const token = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  return verifySessionToken(token);
};

export const getAuthUserFromRequest = async (request: Request): Promise<AuthUser | null> => {
  const payload = await getSessionPayloadFromRequest(request);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.globalRole,
  };
};

export const resolveRoleFromRequest = async (request: Request): Promise<UserRole | null> => {
  const user = await getAuthUserFromRequest(request);
  return user?.role ?? null;
};

export const ensureMinimumRole = async (request: Request, minimum: UserRole) => {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { user: null, allowed: false };
  }

  const allowed = roleRank[user.role] >= roleRank[minimum];
  return { user, allowed };
};

export const ensureProjectRole = async (
  request: Request,
  projectId: string,
  minimum: UserRole
): Promise<{ user: AuthUser | null; allowed: boolean; membership: ProjectMember | null }> => {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { user: null, allowed: false, membership: null };
  }

  if (user.role === "admin") {
    return { user, allowed: true, membership: null };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return { user, allowed: false, membership: null };
  }

  return {
    user,
    membership,
    allowed: roleRank[membership.role] >= roleRank[minimum],
  };
};

export const serializeAuthCookie = (token: string) =>
  `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

export const clearAuthCookie = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
