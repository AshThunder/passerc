import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { WalletProvider } from './hooks/useWallet'
import { FhenixProvider } from './hooks/useFhenix'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <FhenixProvider>
        <App />
      </FhenixProvider>
    </WalletProvider>
  </React.StrictMode>,
)
