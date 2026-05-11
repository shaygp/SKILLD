import './lib/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { SolanaProvider } from './lib/solana/SolanaProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SolanaProvider>
  </StrictMode>,
);
