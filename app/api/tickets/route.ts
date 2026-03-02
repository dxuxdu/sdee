import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subject, email, category, message } = body;

        if (!subject || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = new TicketDatabase();
        const result = await db.createTicket({
            subject,
            userEmail: email,
            userName: email.split('@')[0], // Simple username derivation
            category,
            description: message
        });

        return NextResponse.json({ success: true, ticket: result });

    } catch (error: any) {
        console.error('Create Ticket Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        const db = new TicketDatabase();
        
        if (email) {
            const tickets = await db.getTicketsByEmail(email);
            return NextResponse.json({ success: true, tickets });
        }
        
        // If no email, maybe return empty or error? Support page usually needs context.
        return NextResponse.json({ success: true, tickets: [] });

    } catch (error: any) {
        console.error('Get Tickets Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
