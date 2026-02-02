import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/syncUser";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await syncUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await request.json();
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  // ensure this run belongs to the logged-in user
  const dbUser = await prisma.user.findUnique({ where: { clerkId: user.clerkId } });
  if (!dbUser) return NextResponse.json({ error: "User not synced" }, { status: 400 });

  const run = await prisma.agentRun.findFirst({
    where: { id: runId, userId: dbUser.id },
    select: { id: true },
  });

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  console.log('[API] Sending inngest event for runId:', run.id);
  
  const eventIds = await inngest.send({
    name: "agent/run.requested",
    data: { runId: run.id },
  });

  console.log('[API] Inngest event sent:', eventIds);

  return NextResponse.json({ ok: true, message: "Agent run started", runId: run.id, eventIds });
}
