import { syncUser } from '@/lib/syncUser';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await syncUser();
    
    return NextResponse.json({
      clerkUserId,
      dbUser: user ? {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
      } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
