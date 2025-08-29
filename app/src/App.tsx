import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/utils/web3'
import { useFHEVM } from '@/hooks/useFHEVM'
import WalletConnect from '@/components/WalletConnect'
import BindXAccount from '@/components/BindXAccount'
import SendToXAccount from '@/components/SendToXAccount'
import WithdrawETH from '@/components/WithdrawETH'
import '@rainbow-me/rainbowkit/styles.css'
import './App.css'

const queryClient = new QueryClient()

type Tab = 'bind' | 'send' | 'withdraw'

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('bind')
  const { initialized, loading, error } = useFHEVM()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>⚡ Hidden Social</h1>
            <p>Anonymous Social Payment Platform with FHE</p>
          </div>
          
          <div className="header-middle">
            {/* FHE 状态指示器 */}
            <div className="fhe-status">
              {loading && (
                <div className="status-indicator loading">
                  <div className="status-icon">
                    <div className="loading-ring"></div>
                  </div>
                  <div className="status-text">
                    <strong>Initializing FHE</strong>
                  </div>
                </div>
              )}
              {error && (
                <div className="status-indicator error">
                  <div className="status-icon">🚨</div>
                  <div className="status-text">
                    <strong>FHE Init Failed</strong>
                  </div>
                  <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
                </div>
              )}
              {initialized && (
                <div className="status-indicator success">
                  <div className="status-icon">🔐</div>
                  <div className="status-text">
                    <strong>FHE Ready</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="header-right">
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="app-main">
        <nav className="tab-nav">
          <button 
            className={activeTab === 'bind' ? 'active' : ''} 
            onClick={() => setActiveTab('bind')}
          >
            <span className="tab-icon">🔗</span>
            <div className="tab-text">
              <strong>Bind Account</strong>
              <small>Link X Account</small>
            </div>
          </button>
          <button 
            className={activeTab === 'send' ? 'active' : ''} 
            onClick={() => setActiveTab('send')}
          >
            <span className="tab-icon">💸</span>
            <div className="tab-text">
              <strong>Send Assets</strong>
              <small>Send ETH</small>
            </div>
          </button>
          <button 
            className={activeTab === 'withdraw' ? 'active' : ''} 
            onClick={() => setActiveTab('withdraw')}
          >
            <span className="tab-icon">💰</span>
            <div className="tab-text">
              <strong>Withdraw Assets</strong>
              <small>Withdraw ETH</small>
            </div>
          </button>
        </nav>

        <div className="tab-content">
          {activeTab === 'bind' && <BindXAccount />}
          {activeTab === 'send' && <SendToXAccount />}
          {activeTab === 'withdraw' && <WithdrawETH />}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Fully encrypted privacy protection with Zama FHE technology
        </p>
        <p>
          <small>
            Supported Network: Sepolia Testnet | 
            Contract: {import.meta.env.VITE_CONTRACT_ADDRESS || 'Not deployed'}
          </small>
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App