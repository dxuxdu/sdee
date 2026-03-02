import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

function isAdmin(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '');
    const adminPassword = process.env.ADMIN_PASSWORD;
    try {
        const decoded = Buffer.from(token, 'base64').toString('ascii');
        return decoded === adminPassword;
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    if (!isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new TicketDatabase();
        const tickets = await db.getAllTickets();
        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
