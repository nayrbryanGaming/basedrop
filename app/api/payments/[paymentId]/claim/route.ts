import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

function cleanBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(cleanBigInt);
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) cleaned[key] = cleanBigInt(obj[key]);
        return cleaned;
    }
    return obj;
}

function safeResponse(data: any, status = 200) {
    return NextResponse.json(cleanBigInt(data), {
        status,
        headers: { 'X-BaseDrop-Protocol': '1.0', 'Cache-Control': 'no-store' },
    });
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    if (!isSupabaseConfigured || !supabase) {
        return safeResponse({ error: 'Database not configured' }, 503);
    }

    const { paymentId } = await params;

    if (!/^0x[0-9a-f]{64}$/i.test(paymentId)) {
        return safeResponse({ error: 'Invalid payment ID format' }, 400);
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return safeResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { receiver_wallet, tx_hash } = body ?? {};

    if (!receiver_wallet || !/^0x[0-9a-fA-F]{40}$/.test(receiver_wallet)) {
        return safeResponse({ error: 'Valid receiver_wallet address is required' }, 400);
    }

    if (!tx_hash || !/^0x[0-9a-fA-F]{64}$/.test(tx_hash)) {
        return safeResponse({ error: 'Valid tx_hash is required' }, 400);
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .update({
                status: 'claimed',
                receiver_wallet: receiver_wallet.toLowerCase(),
                tx_hash,
            })
            .eq('payment_id', paymentId.toLowerCase())
            .eq('status', 'unclaimed')
            .select();

        if (error) {
            console.error('[SUPABASE] Claim update failed:', error);
            return safeResponse({ error: 'Database update failed', message: error.message }, 500);
        }

        if (!data || data.length === 0) {
            return safeResponse({ error: 'Claim rejected: payment already claimed, cancelled, or not found' }, 400);
        }

        return safeResponse({ message: 'Payment claimed', data: data[0] });
    } catch (err: any) {
        console.error('[API] Claim error:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
