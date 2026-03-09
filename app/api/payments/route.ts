import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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

export async function GET() {
    if (!isSupabaseConfigured || !supabase) {
        return safeResponse({ status: 'error', message: 'Environment configuration missing (SUPABASE_URL/KEY).', database: 'unconfigured' }, 503);
    }

    let dbStatus = 'syncing';
    try {
        const { error } = await supabase.from('payments').select('count', { count: 'exact', head: true });
        dbStatus = error ? `error: ${error.message}` : 'connected';
    } catch (e: any) {
        dbStatus = `exception: ${e.message}`;
    }

    return safeResponse({ status: 'ok', database: dbStatus, version: '1.0' });
}

export async function POST(req: Request) {
    if (!isSupabaseConfigured || !supabase) {
        return safeResponse({ error: 'Database not configured' }, 503);
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return safeResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { amount, token, sender_wallet, payment_id, expires_at } = body ?? {};

    if (!amount || !token || !sender_wallet || !payment_id) {
        return safeResponse({ error: 'Missing required fields: amount, token, sender_wallet, payment_id' }, 400);
    }

    if (!/^0x[0-9a-f]{64}$/i.test(payment_id)) {
        return safeResponse({ error: 'Invalid payment_id format' }, 400);
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(sender_wallet)) {
        return safeResponse({ error: 'Invalid sender_wallet address' }, 400);
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return safeResponse({ error: 'Amount must be a positive number' }, 400);
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                payment_id: payment_id.toLowerCase(),
                amount: amount.toString(),
                token,
                sender_wallet: sender_wallet.toLowerCase(),
                expires_at: expires_at || null,
                status: 'unclaimed',
            }])
            .select();

        if (error) {
            console.error('[SUPABASE] Insert failed:', error);
            if (error.code === '23505') {
                return safeResponse({ error: 'Payment ID already exists' }, 409);
            }
            return safeResponse({ error: 'Database error', message: error.message }, 500);
        }

        return safeResponse({ message: 'Payment created', data: data?.[0] }, 201);
    } catch (err: any) {
        console.error('[SYSTEM] Fatal API exception:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
