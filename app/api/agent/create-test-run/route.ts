import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/syncUser'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const user = await syncUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] Creating test run for user:', user.id)

    // create a simple AgentRun for testing
    const run = await prisma.agentRun.create({
      data: {
        userId: user.id,
        topic: 'Test run',
        goal: 'Smoke test agent',
        status: 'RUNNING', // must be one of: RUNNING, COMPLETED, FAILED
      },
      select: { id: true },
    })

    console.log('[API] Created test run:', run.id)
    return NextResponse.json({ ok: true, runId: run.id })
  } catch (err: any) {
    console.error('[API] /api/agent/create-test-run error:', err.message, err.stack)
    return NextResponse.json(
      { error: String(err.message), details: err.code },
      { status: 500 }
    )
  }
}
