import { NextRequest, NextResponse } from 'next/server';
import { TicketDatabase } from '@/lib/server/db';
import { sendDiscordWebhook } from '@/lib/server/discord';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { games } = body as { games: string[] };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one game must be selected' }, { status: 400 });
    }

    const db = new TicketDatabase();

    // Verify the order exists first
    const payment = await db.getPayment(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const ok = await db.updateGameSelection(id, games);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Failed to save game selection' }, { status: 500 });
    }

    // Build the single combined Discord webhook (purchase info + games)
    const isRoblox = String(id).startsWith('ROBLOX-');
    const method = isRoblox ? 'Roblox' : 'PayPal';
    const tier = (payment.tier || 'N/A').toUpperCase();
    const isRenewal = isRoblox && payment.payment_status === 'COMPLETED' && payment.updated_at !== payment.created_at;

    // Amount display
    let amountDisplay: string;
    if (payment.currency === 'ROBUX') {
      amountDisplay = `${payment.amount ?? '?'} Robux`;
    } else {
      const symbol = payment.currency === 'USD' ? '$' : payment.currency === 'EUR' ? '€' : (payment.currency ?? '');
      amountDisplay = `${symbol}${payment.amount ?? '?'}`;
    }

    // License key
    const keys: string[] = Array.isArray(payment.generated_keys) ? payment.generated_keys : [];
    const keyDisplay = keys.length > 0 ? `||${keys[0]}||` : 'N/A';

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'Tier', value: tier, inline: true },
      { name: 'Amount', value: amountDisplay, inline: true },
    ];

    if (isRoblox) {
      fields.push(
        { name: 'Type', value: isRenewal ? 'Renewal' : 'New Purchase', inline: true },
        { name: 'Roblox Username', value: payment.roblox_username || 'N/A', inline: true },
        { name: 'User ID', value: payment.payer_id ? String(payment.payer_id).replace('ROBLOX_', '') : 'N/A', inline: true },
      );
    } else {
      fields.push(
        { name: 'Transaction ID', value: id, inline: false },
        { name: 'Customer Email', value: payment.payer_email || 'N/A', inline: false },
      );
    }

    fields.push(
      { name: 'License Key', value: keyDisplay, inline: false },
      { name: 'Games Selected', value: games.map((g) => `• ${g}`).join('\n'), inline: false },
    );

    const title = isRoblox
      ? `💎 ${isRenewal ? 'Premium Renewal' : 'New Premium Purchase'} (Roblox)`
      : '💎 New Premium Purchase (PayPal)';
    const color = isRoblox ? 0x10b981 : 0xfbbf24;
    const mention = isRoblox
      ? `<@442317061104861184> 💰 ${isRenewal ? 'Premium Renewal' : 'New Premium Purchase'}!`
      : '<@442317061104861184> 💰 New Premium Purchase!';

    await sendDiscordWebhook(mention, [{
      title,
      color,
      fields,
      timestamp: new Date().toISOString(),
    }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving game selection:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
