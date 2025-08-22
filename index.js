import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

// -- Health / Root routes --
app.get('/', (req, res) => {
  res.send('🚀 MemeCoin Pulse backend is running. Use /api/tokens or /health');
});

app.get('/health', async (req, res) => {
  const ok = await pool.query('select 1 as ok').then(()=>true).catch(()=>false);
  res.json({ ok, uptime: process.uptime() });
});

// -- API routes (your existing handlers) --
app.get('/api/tokens', async (req, res) => {
  try {
    const r = await pool.query('select id,address,name,symbol,chain,source,tx_hash,created_at from tokens order by id desc limit 500');
    res.json({ data: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/influencers', async (req, res) => {
  try {
    const r = await pool.query('select handle from influencers order by handle');
    res.json({ data: r.rows.map(r=>r.handle) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/influencers', async (req, res) => {
  try {
    const { handle } = req.body || {};
    if (!handle) return res.status(400).json({ error: 'handle required' });
    await pool.query('insert into influencers(handle) values($1) on conflict do nothing', [ handle.startsWith('@')?handle:'@'+handle ]);
    const rr = await pool.query('select handle from influencers order by handle');
    res.json({ ok: true, data: rr.rows.map(r=>r.handle) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tokens', async (req, res) => {
  try {
    const { name, symbol, address, chain, source } = req.body || {};
    if (!address || !chain) return res.status(400).json({ error: 'address and chain required' });
    const q = await pool.query('insert into tokens(address,name,symbol,chain,source,tx_hash) values($1,$2,$3,$4,$5,$6) on conflict(address) do nothing returning *',
      [address.toLowerCase(), name||null, symbol||null, chain, source||'manual', null]);
    res.json({ ok: true, data: q.rows[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -- Start server using Render's PORT --
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
