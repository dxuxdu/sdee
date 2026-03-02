import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: ticketId } = await params;
        const body = await req.json();
        const { message, authorType, authorName } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const db = new TicketDatabase();
        
        // Verify ticket exists
        const ticket = await db.getTicket(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const replyId = await db.addReply(ticketId, {
            authorType: authorType || 'user',
            authorName: authorName || 'User',
            message
        });

        // Auto-reopen if closed (optional logic)
        // if (ticket.status === 'closed') await db.updateStatus(ticketId, 'open');

        return NextResponse.json({ success: true, replyId });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
