import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> } // Correct type for Next.js 15+
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ success: false, error: 'Missing id or email' }, { status: 400 });
    }

    const payment = await db.getPayment(id);

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    if (payment.payer_email !== email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
