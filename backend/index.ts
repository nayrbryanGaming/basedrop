import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://basedrop.vercel.app',
        /\.vercel\.app$/ // Allow all Vercel previews
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('BaseDrop Backend is running');
});

// Create Payment Link
app.post('/api/payments', async (req, res) => {
    const { amount, token, sender_wallet, payment_id } = req.body;

    if (!amount || !token || !sender_wallet || !payment_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
        .from('payments')
        .insert([
            {
                payment_id,
                amount,
                token,
                sender_wallet,
                status: 'unclaimed'
            }
        ]);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Payment link created', data });
});

// Get Payment Details
app.get('/api/payments/:payment_id', async (req, res) => {
    const { payment_id } = req.params;

    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_id', payment_id)
        .single();

    if (error) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(data);
});

// Claim Payment (Update status)
app.post('/api/payments/:payment_id/claim', async (req, res) => {
    const { payment_id } = req.params;
    const { receiver_wallet, tx_hash } = req.body;

    const { data, error } = await supabase
        .from('payments')
        .update({
            status: 'claimed',
            receiver_wallet,
            tx_hash
        })
        .eq('payment_id', payment_id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Payment claimed updated in DB', data });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
