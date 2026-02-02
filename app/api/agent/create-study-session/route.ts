import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncUser } from '@/lib/syncUser';
import { inngest } from '@/inngest/client';

export async function POST(request: Request) {
  try {
    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, goal, timeAvailable, remindAfter } = body;

    // Validation
    if (!topic?.trim() || !goal?.trim()) {
      return NextResponse.json(
        { error: 'Topic and goal are required' },
        { status: 400 }
      );
    }

    const timeAvailableNum = parseInt(timeAvailable) || 60;
    const remindAfterNum = parseInt(remindAfter) || 45;

    // Create the study session (AgentRun) with reminder timing in state
    const run = await prisma.agentRun.create({
      data: {
        userId: user.id,
        topic: topic.trim(),
        goal: goal.trim(),
        timeAvailable: `${timeAvailableNum}`,
        status: 'RUNNING',
        iteration: 0,
        state: { remindAfterMinutes: remindAfterNum }, // Store for agent to use
      },
      select: { id: true },
    });

    console.log('[API] Created study session:', run.id);

    // Send event to Inngest to start the agent
    // Agent will handle reminder scheduling with step.sleep() + step.sendEvent()
    await inngest.send({
      name: 'agent/run.requested',
      data: {
        runId: run.id,
        userId: user.id,
      },
    });

    console.log('[API] Sent agent/run.requested event');

    return NextResponse.json({
      ok: true,
      runId: run.id,
      message: `Study session created! Reminder will be sent in ${remindAfterNum} minutes.`,
    });
  } catch (err: any) {
    console.error('[API] create-study-session error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to create study session' },
      { status: 500 }
    );
  }
}
