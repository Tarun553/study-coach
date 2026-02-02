import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { taskId, done } = await request.json();

    if (!taskId || typeof done !== 'boolean') {
      return NextResponse.json(
        { error: 'taskId and done status required' },
        { status: 400 }
      );
    }

    const task = await prisma.studyTask.update({
      where: { id: taskId },
      data: { done },
    });

    return NextResponse.json({ ok: true, task });
  } catch (err: any) {
    console.error('[API] /api/task/toggle error:', err.message);
    return NextResponse.json({ error: String(err.message) }, { status: 500 });
  }
}
