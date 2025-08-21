import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Pool } from 'pg';
import axios from 'axios';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UNISWAP_FACTORY = process.env.UNISWAP_FACTORY || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const PANCAKE_FACTORY = process.env.PANCAKE_FACTORY || '0xBCfCcbde45cE874adCB698cC183deBcF17952812';
const iface = new ethers.Interface(["event PairCreated(address indexed token0, address indexed token1, address pair, uint)"]);
const TOPIC = iface.getEvent("PairCreated").topicHash;

async function upsertToken(token){ try{ const res = await pool.query(`insert into tokens(address,name,symbol,chain,source,tx_hash) values($1,$2,$3,$4,$5,$6) on conflict(address) do update set name=coalesce(tokens.name,excluded.name), symbol=coalesce(tokens.symbol,excluded.symbol) returning id`, [token.address.toLowerCase(), token.name, token.symbol, token.chain, token.source, token.txHash]); return res.rows[0]; }catch(e){ console.error('upsert error',e.message); } }

async function pollFactoryRPC(chainCfg){ if(!chainCfg.rpc) return; try{ const provider = new ethers.JsonRpcProvider(chainCfg.rpc); const to = await provider.getBlockNumber(); const from = Math.max(0, to - (parseInt(process.env.CHAIN_BLOCK_SPAN||'150',10))); const logs = await provider.getLogs({ address: chainCfg.factory, topics: [TOPIC], fromBlock: from, toBlock: to }); for(const log of logs){ const decoded = iface.decodeEventLog("PairCreated", log.data, log.topics); const t0 = decoded[0], t1 = decoded[1]; const block = await provider.getBlock(log.blockNumber); const ts = new Date(Number(block.timestamp)*1000).toISOString(); const tryMeta = async (addr) => { try{ const c = new ethers.Contract(addr, ["function name() view returns (string)","function symbol() view returns (string)"], provider); const res = await Promise.allSettled([c.name(), c.symbol()]); return { name: res[0].status==='fulfilled'?res[0].value:null, symbol: res[1].status==='fulfilled'?res[1].value:null }; }catch(e){ return {name:null,symbol:null}; } }; const m0 = await tryMeta(t0); const m1 = await tryMeta(t1); await upsertToken({ address: t0, name: m0.name, symbol: m0.symbol, chain: chainCfg.name, source: chainCfg.source, txHash: log.transactionHash }); await upsertToken({ address: t1, name: m1.name, symbol: m1.symbol, chain: chainCfg.name, source: chainCfg.source, txHash: log.transactionHash }); } }catch(e){ console.error('pollFactoryRPC error', e.message); } }

async function pollTwitterSymbols(){ try{ const bearer = process.env.TWITTER_BEARER_TOKEN; if(!bearer) return; const res = await axios.get('https://api.twitter.com/2/tweets/search/recent', { params: { query: '$ -is:retweet', max_results: 10, 'tweet.fields':'created_at,public_metrics' }, headers: { Authorization: `Bearer ${bearer}` } }); const data = res.data?.data || []; for(const t of data){ const matches = (t.text.match(/\$[A-Z0-9]{2,10}/g) || []); for(const m of matches){ const sym = m.replace('$',''); await pool.query('insert into tokens(address,name,symbol,chain,source,tx_hash) values($1,$2,$3,$4,$5,$6) on conflict(address) do nothing', [`twitter:${t.id}:${sym}`, null, sym, 'OFFCHAIN', 'twitter', t.id]); } } }catch(e){ console.error('twitter poll error', e.message); } }

async function loop(){ const cfgs = [ { name:'ETH', rpc: process.env.ETH_RPC_URL || '', factory: process.env.UNISWAP_FACTORY || UNISWAP_FACTORY, source: 'uniswap' }, { name:'BSC', rpc: process.env.BSC_RPC_URL || '', factory: process.env.PANCAKE_FACTORY || PANCAKE_FACTORY, source: 'pancake' } ]; try{ await Promise.all(cfgs.map(c=>pollFactoryRPC(c))); await pollTwitterSymbols(); }catch(e){ console.error('loop error', e.message); } }

setInterval(loop, Math.max(15, parseInt(process.env.POLL_SECONDS||'45',10)) * 1000);
console.log('listener started');
loop();
