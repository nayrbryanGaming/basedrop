import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '../../../../lib/supabase';

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
    if (!isDbConfigured) {
        return safeResponse({ error: 'Database not configured' }, 503);
    }

    const { wallet } = await params;

    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        return safeResponse({ error: 'Invalid wallet address' }, 400);
    }

    try {
        const rows = await sql`
            SELECT * FROM payments
            WHERE sender_wallet = ${wallet.toLowerCase()}
            ORDER BY created_at DESC
        `;

        return safeResponse(rows);
    } catch (err: any) {
        console.error('[API] User payments error:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
