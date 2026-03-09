import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '../../../lib/supabase';

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
    { params }: { params: Promise<{ paymentId: string }> }
) {
    if (!isDbConfigured) {
        return safeResponse({ error: 'Database not configured' }, 503);
    }

    const { paymentId } = await params;

    if (!/^0x[0-9a-f]{64}$/i.test(paymentId)) {
        return safeResponse({ error: 'Invalid payment ID format' }, 400);
    }

    try {
        const rows = await sql`
            SELECT * FROM payments WHERE payment_id = ${paymentId.toLowerCase()} LIMIT 1
        `;

        if (rows.length === 0) {
            return safeResponse({ error: 'Payment record not found' }, 404);
        }

        return safeResponse(rows[0]);
    } catch (err: any) {
        console.error('[API] GET payment error:', err.message);
        return safeResponse({ error: 'Internal Server Error' }, 500);
    }
}
