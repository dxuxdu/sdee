import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

const db = new TicketDatabase();

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // 1. Verify Code
    const verification = await db.verifyCode(email, code);

    if (!verification.success) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
    }

    // 2. Return Success
    // In a real app we'd set a cookie here.
    // For this implementation, we'll return success and let the client handle state.
    return NextResponse.json({ success: true, message: 'Verified successfully' });

  } catch (error: any) {
    console.error('Verify Code Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
