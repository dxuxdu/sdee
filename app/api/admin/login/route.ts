import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();
        const db = new TicketDatabase();
        
        // Temporarily get debug info
        let debugInfo = {};
        try {
            const { data, error } = await (db as any).client
                .from('admin_credentials')
                .select('password')
                .single();
            debugInfo = {
                found: !!data,
                error: error?.message,
                inputLen: password?.length,
                dbLen: data?.password?.length,
                dbPass: data?.password // Be careful, only for debugging
            };
        } catch (e: any) {
            debugInfo = { exception: e.message };
        }

        const isValid = await db.validateAdminPassword(password);

        if (isValid) {
            const token = Buffer.from(password).toString('base64');
            return NextResponse.json({ success: true, token });
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Invalid password',
            _debug: debugInfo
        }, { status: 401 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
