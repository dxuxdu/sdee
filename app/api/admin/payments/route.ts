import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

async function isAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = Buffer.from(token, 'base64').toString('ascii');
        const db = new TicketDatabase();
        return await db.validateAdminPassword(decoded);
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const authorized = await isAdmin(req);
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new TicketDatabase();
        const payments = await db.getAllPayments();
        const stats = await db.getVisitorStats(); 
        
        // Calculate revenue stats
        const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const paypalPurchases = payments.filter((p: any) => p.currency !== 'ROBUX').length;
        const robloxPurchases = payments.filter((p: any) => p.currency === 'ROBUX').length;

        return NextResponse.json({ 
            success: true, 
            payments,
            stats: {
                totalPurchases: payments.length,
                paypalPurchases,
                robloxPurchases,
                totalRevenue
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
