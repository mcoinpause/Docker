# MemeCoin Pulse — Railway-ready bundle

## What this includes
- Backend (Express) + Postgres integration
- Listener (polling service) for Uniswap / Pancake PairCreated logs and Twitter recent search
- Frontend demo (static) with wallet placeholders
- docker-compose for local deploy or use on Railway (split services)

## How to deploy to Railway (recommended)
1. Create a new GitHub repo and push this project.
2. On Railway, create a new project and connect the repo.
3. Add a Postgres plugin in Railway — copy the DATABASE_URL into Railway env vars.
4. Add env vars in Railway (set from `.env.example`):
   - DATABASE_URL, ETH_RPC_URL, BSC_RPC_URL, UNISWAP_FACTORY, PANCAKE_FACTORY, TWITTER_BEARER_TOKEN, ETHERSCAN_API_KEY, BSCSCAN_API_KEY
5. Deploy the backend and listener services (Railway auto-detects Dockerfiles).
6. Deploy the frontend (static) or host separately (Vercel/Netlify). Ensure frontend's `/api` points to backend URL.
