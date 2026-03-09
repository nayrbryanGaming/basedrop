import { neon } from '@neondatabase/serverless';

export const isDbConfigured = Boolean(process.env.POSTGRES_URL);

// Tagged template SQL function — reads POSTGRES_URL injected by Vercel Storage.
// Guard with isDbConfigured before every query so errors stay clear.
export const sql = neon(process.env.POSTGRES_URL || 'postgresql://user:pass@localhost/placeholder');

// Back-compat aliases so old import paths still work during transition
export const isSupabaseConfigured = isDbConfigured;
