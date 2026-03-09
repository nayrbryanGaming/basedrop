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

export async function GET(
    req: Request,
    { params }: { params: Promise<{ wallet: string }> }
) {
    if (!isSupabaseConfigured || !supabase) {
        return safeResponse({ error: 'Database not configured' }, 503);
    }

    const { wallet } = await params;

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        return safeResponse({ error: 'Invalid wallet address' }, 400);
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('sender_wallet', wallet.toLowerCase())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[SUPABASE] Fetch failed:', error);
            return safeResponse({ error: 'Database error', message: error.message }, 500);
        }

        return safeResponse(data ?? []);
    } catch (err: any) {
        console.error('[API] User payments error:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
