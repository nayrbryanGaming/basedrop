-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id TEXT UNIQUE NOT NULL, -- bytes32 from contract
    amount NUMERIC NOT NULL,
    token TEXT NOT NULL,
    sender_wallet TEXT NOT NULL,
    receiver_wallet TEXT,
    status TEXT DEFAULT 'unclaimed', -- unclaimed, claimed, cancelled
    tx_hash TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous selects (to check payment status on claim page)
CREATE POLICY "Allow anonymous selects" ON public.payments
    FOR SELECT USING (true);

-- Allow anonymous inserts (to create payment records)
CREATE POLICY "Allow anonymous inserts" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Allow anonymous updates (to record claims)
CREATE POLICY "Allow anonymous updates" ON public.payments
    FOR UPDATE USING (true) WITH CHECK (true);
