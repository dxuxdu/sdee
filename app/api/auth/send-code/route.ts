import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { EmailService } from '@/lib/server/email';

const db = new TicketDatabase();
const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if user exists (has purchased before)
    const exists = await db.checkUserExists(email);
    
    if (!exists) {
        // Security: Don't reveal if user exists or not, but for this specific flow "Client Area" 
        // implies they must be a client. 
        // We can either return generic success or specific error.
        // User requested: "if it has a record of them".
        return NextResponse.json({ 
            error: 'No account found with this email. Please ensure you are using the email from your purchase.' 
        }, { status: 404 });
    }

    // 2. Generate Code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save Code to DB
    await db.createVerificationCode(email, code);

    // 4. Send Email
    const result = await emailService.sendVerificationCode(email, code);

    if (!result.success) {
        return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent.' });

  } catch (error: any) {
    console.error('Send Code Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
