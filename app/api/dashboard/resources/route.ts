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

    // Get resources for runs belonging to the current user
    const resources = await prisma.resource.findMany({
      where: {
        run: {
          userId: user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    console.log(`[API] /dashboard/resources - Found ${resources.length} resources for user ${user.id}`);
    return NextResponse.json({ ok: true, resources });
  } catch (err: any) {
    console.error('[API] /dashboard/resources error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
