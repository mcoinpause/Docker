
// backend/index.js
import express from 'express';
import axios from 'axios';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

// Postgres setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'memecoin_pulse',
  password: 'yourpassword',
  port: 5432,
});

// Etherscan/BSCScan API keys (replace with real)
const ETHERSCAN_API_KEY = "your_etherscan_api_key";
const BSCSCAN_API_KEY = "your_bscscan_api_key";

// Fetch token info from Etherscan
app.get('/api/etherscan/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const response = await axios.get(
      \`https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=\${address}&apikey=\${ETHERSCAN_API_KEY}\`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch token info from BSCScan
app.get('/api/bscscan/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const response = await axios.get(
      \`https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=\${address}&apikey=\${BSCSCAN_API_KEY}\`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example: Save a tracked token into Postgres
app.post('/api/tokens', async (req, res) => {
  try {
    const { name, symbol, address, chain } = req.body;
    const result = await pool.query(
      "INSERT INTO tokens (name, symbol, address, chain) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, symbol, address, chain]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tracked tokens
app.get('/api/tokens', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tokens ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log('Backend running on port 4000'));
