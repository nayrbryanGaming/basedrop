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

    // tx_hash is optional — body may be empty if frontend didn't send one
    let tx_hash: string | undefined;
    try {
        const body = await req.json();
        tx_hash = body?.tx_hash;
    } catch {
        // Safe to continue without tx_hash
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .update({ status: 'cancelled', ...(tx_hash ? { tx_hash } : {}) })
            .eq('payment_id', paymentId.toLowerCase())
            .eq('status', 'unclaimed')
            .select();

        if (error) {
            console.error('[SUPABASE] Cancel update failed:', error);
            return safeResponse({ error: 'Database update failed', message: error.message }, 500);
        }

        if (!data || data.length === 0) {
            return safeResponse({ error: 'Cancel rejected: payment already claimed, cancelled, or not found' }, 400);
        }

        return safeResponse({ message: 'Payment cancelled', data: data[0] });
    } catch (err: any) {
        console.error('[API] Cancel error:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
