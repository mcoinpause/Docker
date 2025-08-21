
// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/tokens')
      .then(res => res.json())
      .then(data => setTokens(data));
  }, []);

  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  return (
    <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="p-6">
            <h1 className="text-3xl font-bold">MemeCoin Pulse</h1>
            <WalletMultiButton />
            <div className="mt-6">
              <h2 className="text-xl font-semibold">Tracked Tokens</h2>
              <ul>
                {tokens.map((t) => (
                  <li key={t.id} className="border-b py-2">
                    {t.name} ({t.symbol}) — {t.chain}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
