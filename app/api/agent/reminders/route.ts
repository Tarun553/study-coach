import { prisma } from '@/lib/prisma';
import { syncUser } from '@/lib/syncUser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Authenticate user
    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get reminders for runs belonging to the current user
    const reminders = await prisma.reminderJob.findMany({
      where: {
        run: {
          userId: user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { run: true },
    });
    
    console.log(`[API] /agent/reminders - Found ${reminders.length} reminders for user ${user.id}`);
    return NextResponse.json({ ok: true, reminders });
  } catch (err: any) {
    console.error('[API] /api/agent/reminders error:', err.message, err.stack);
    return NextResponse.json({ 
      error: String(err.message),
      details: err.stack 
    }, { status: 500 });
  }
}
