import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

const db = new TicketDatabase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Fetch Payments
    const payments = await db.getUserPayments(email);

    // Calculate Stats
    const totalOrders = payments.length;
    const totalSpent = payments.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0).toFixed(2);
    
    // Determine Active Plan (Logic: Look for recent active subs)
    // For now, just show the latest tier if recent, or "Inactive"
    const latestPayment = payments[0];
    const activePlan = latestPayment ? latestPayment.tier : 'None';

    return NextResponse.json({
        success: true,
        data: {
            orders: payments.slice(0, 5), // Recent 5
            stats: {
                totalOrders,
                totalSpent,
                activePlan,
                accountStatus: 'Active'
            }
        }
    });

  } catch (error: any) {
    console.error('Client Data API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
