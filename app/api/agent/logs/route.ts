import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const logs = await prisma.agentStepLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // last 50 logs
    });

    return NextResponse.json({ ok: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
