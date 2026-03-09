-- BaseDrop — Vercel Postgres (Neon) Schema Setup
-- Run this in: Vercel Dashboard → Storage → your database → Query

-- 1. Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id    TEXT PRIMARY KEY,
    amount        TEXT NOT NULL,
    token         TEXT NOT NULL,
    sender_wallet TEXT NOT NULL,
    receiver_wallet TEXT,
    status        TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'cancelled')),
    expires_at    TIMESTAMPTZ,
    tx_hash       TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_payments_sender_wallet ON payments (sender_wallet);

-- 3. Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done! Schema is ready for BaseDrop.
