import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const baseUsers = [
  {
    email: "admin@feedbackhub.local",
    name: "System Admin",
    globalRole: "admin",
    password: "Admin@123",
  },
  {
    email: "sara@product.io",
    name: "Sara",
    globalRole: "pm",
    password: "Pm@123456",
  },
  {
    email: "ahmed@product.io",
    name: "Ahmed",
    globalRole: "pm",
    password: "Pm@123456",
  },
  {
    email: "nour@product.io",
    name: "Nour",
    globalRole: "pm",
    password: "Pm@123456",
  },
  {
    email: "viewer@feedbackhub.local",
    name: "Read Only",
    globalRole: "viewer",
    password: "Viewer@123",
  },
];

const projects = [
  {
    id: "PRJ-001",
    name: "Customer Mobile App",
    owner: "sara@product.io",
    totalComments: 74,
    openItems: 26,
    highPriority: 8,
    lastUpdate: new Date("2026-03-02"),
    ownerEmail: "sara@product.io",
  },
  {
    id: "PRJ-002",
    name: "Merchant Portal",
    owner: "ahmed@product.io",
    totalComments: 49,
    openItems: 17,
    highPriority: 6,
    lastUpdate: new Date("2026-03-02"),
    ownerEmail: "ahmed@product.io",
  },
  {
    id: "PRJ-003",
    name: "Operations Dashboard",
    owner: "nour@product.io",
    totalComments: 36,
    openItems: 11,
    highPriority: 3,
    lastUpdate: new Date("2026-03-01"),
    ownerEmail: "nour@product.io",
  },
];

const feedback = [
  {
    id: "FB-1001",
    projectId: "PRJ-001",
    title: "Checkout fails when adding promo code",
    summary: "Customers report a loop back to cart after entering discount coupon.",
    source: "whatsapp",
    category: "bug",
    moduleTag: "checkout",
    status: "in_progress",
    priority: 5,
    owner: "sara@product.io",
    mentions: 12,
    createdAt: new Date("2026-02-27"),
  },
  {
    id: "FB-1002",
    projectId: "PRJ-002",
    title: "Need export for monthly analytics",
    summary: "Finance team asks for CSV and PDF export from analytics module.",
    source: "document",
    category: "feature",
    moduleTag: "analytics",
    status: "triaged",
    priority: 4,
    owner: "ahmed@product.io",
    mentions: 6,
    createdAt: new Date("2026-02-28"),
  },
  {
    id: "FB-1003",
    projectId: "PRJ-001",
    title: "Mobile dashboard feels slow",
    summary: "Several comments mention 5-7s load time on first dashboard visit.",
    source: "whatsapp",
    category: "complaint",
    moduleTag: "dashboard",
    status: "new",
    priority: 3,
    owner: "unassigned",
    mentions: 9,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "FB-1004",
    projectId: "PRJ-003",
    title: "Clarify role permission matrix",
    summary: "Ops team requests a simple matrix to understand who can approve refunds.",
    source: "manual",
    category: "question",
    moduleTag: "access-control",
    status: "blocked",
    priority: 2,
    owner: "nour@product.io",
    mentions: 3,
    createdAt: new Date("2026-03-02"),
  },
];

async function main() {
  const userMap = new Map();

  for (const user of baseUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        globalRole: user.globalRole,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        passwordHash,
      },
    });

    userMap.set(user.email, upserted.id);
  }

  for (const project of projects) {
    const creatorId = userMap.get(project.ownerEmail) ?? userMap.get("admin@feedbackhub.local");

    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        id: project.id,
        name: project.name,
        owner: project.owner,
        totalComments: project.totalComments,
        openItems: project.openItems,
        highPriority: project.highPriority,
        lastUpdate: project.lastUpdate,
        createdById: creatorId,
      },
      create: {
        id: project.id,
        name: project.name,
        owner: project.owner,
        totalComments: project.totalComments,
        openItems: project.openItems,
        highPriority: project.highPriority,
        lastUpdate: project.lastUpdate,
        createdById: creatorId,
      },
    });
  }

  const memberships = [
    { projectId: "PRJ-001", email: "sara@product.io", role: "pm" },
    { projectId: "PRJ-002", email: "ahmed@product.io", role: "pm" },
    { projectId: "PRJ-003", email: "nour@product.io", role: "pm" },
    { projectId: "PRJ-001", email: "admin@feedbackhub.local", role: "admin" },
    { projectId: "PRJ-002", email: "admin@feedbackhub.local", role: "admin" },
    { projectId: "PRJ-003", email: "admin@feedbackhub.local", role: "admin" },
    { projectId: "PRJ-001", email: "viewer@feedbackhub.local", role: "viewer" },
    { projectId: "PRJ-002", email: "viewer@feedbackhub.local", role: "viewer" },
  ];

  for (const membership of memberships) {
    const userId = userMap.get(membership.email);
    if (!userId) continue;

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: membership.projectId,
          userId,
        },
      },
      update: {
        role: membership.role,
      },
      create: {
        projectId: membership.projectId,
        userId,
        role: membership.role,
      },
    });
  }

  for (const item of feedback) {
    await prisma.feedbackItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
