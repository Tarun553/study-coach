import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const reminders = await prisma.reminderJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { run: true },
    });
    return NextResponse.json({ ok: true, reminders });
  } catch (err: any) {
    console.error('[API] /api/agent/reminders error:', err.message, err.stack);
    return NextResponse.json({ 
      error: String(err.message),
      details: err.stack 
    }, { status: 500 });
  }
}
