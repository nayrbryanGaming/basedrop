-- 🏥 BaseDrop Supabase Setup Script
-- Run this in your Supabase SQL Editor to fix the 'payments' table.

-- 1. Create the payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id TEXT PRIMARY KEY,
    amount TEXT NOT NULL,
    token TEXT NOT NULL,
    sender_wallet TEXT NOT NULL,
    receiver_wallet TEXT,
    status TEXT DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'cancelled')),
    expires_at TIMESTAMPTZ,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (Allowing Anonymous access for the dApp)
-- Note: In a production app, you'd restrict these further, but for a hackathon/MVP, this is required.

-- Policy: Allow everyone to SELECT (required to check payment status)
CREATE POLICY "Allow public select" 
ON public.payments FOR SELECT 
USING (true);

-- Policy: Allow everyone to INSERT (required to create links)
CREATE POLICY "Allow public insert" 
ON public.payments FOR INSERT 
WITH CHECK (true);

-- Policy: Allow everyone to UPDATE (required to record claims)
CREATE POLICY "Allow public update" 
ON public.payments FOR UPDATE 
USING (true);

-- 4. Create an automatically updated 'updated_at' trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ✅ Setup Complete! Ready for BaseDrop.
