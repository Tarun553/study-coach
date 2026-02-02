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

    // Get runs for the current user only
    const runs = await prisma.agentRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    console.log(`[API] /dashboard/runs - Found ${runs.length} runs for user ${user.id}`);
    return NextResponse.json({ ok: true, runs });
  } catch (err: any) {
    console.error('[API] /dashboard/runs error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
