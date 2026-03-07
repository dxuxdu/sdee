import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, display_name, rating, game, content } = body;

        if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        // Sanitize inputs
        const safeEmail = typeof email === 'string' ? email.trim().slice(0, 254) : null;
        const safeName = typeof display_name === 'string' ? display_name.trim().slice(0, 80) : null;
        const safeGame = typeof game === 'string' ? game.trim().slice(0, 100) : null;
        const safeContent = typeof content === 'string' ? content.trim().slice(0, 500) : null;

        const { error } = await supabase
            .from('reviews')
            .insert([{
                email: safeEmail,
                display_name: safeName,
                rating,
                game: safeGame,
                content: safeContent,
            }]);

        if (error) {
            console.error('Error saving review:', error);
            return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Review route error:', err);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
