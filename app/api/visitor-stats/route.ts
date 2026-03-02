import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function GET(req: NextRequest) {
    try {
        const db = new TicketDatabase();
        const stats = await db.getVisitorStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ totalVisits: 0, uniqueVisitors: 0 }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const db = new TicketDatabase();
        // Ip and UserAgent are ignored by the new logic, but we pass dummy strings
        const stats = await db.recordVisit('global', 'global'); 
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }
}
