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
            <p>基于同态加密的匿名社交支付平台</p>
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
                    <strong>加密模块初始化中</strong>
                  </div>
                </div>
              )}
              {error && (
                <div className="status-indicator error">
                  <div className="status-icon">🚨</div>
                  <div className="status-text">
                    <strong>加密模块失败</strong>
                  </div>
                  <button onClick={() => window.location.reload()} className="retry-btn">重试</button>
                </div>
              )}
              {initialized && (
                <div className="status-indicator success">
                  <div className="status-icon">🔐</div>
                  <div className="status-text">
                    <strong>加密模块就绪</strong>
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
              <strong>绑定账号</strong>
              <small>Link X Account</small>
            </div>
          </button>
          <button 
            className={activeTab === 'send' ? 'active' : ''} 
            onClick={() => setActiveTab('send')}
          >
            <span className="tab-icon">💸</span>
            <div className="tab-text">
              <strong>发送资产</strong>
              <small>Send ETH</small>
            </div>
          </button>
          <button 
            className={activeTab === 'withdraw' ? 'active' : ''} 
            onClick={() => setActiveTab('withdraw')}
          >
            <span className="tab-icon">💰</span>
            <div className="tab-text">
              <strong>提取资产</strong>
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
          使用 Zama FHE 技术实现完全加密的隐私保护
        </p>
        <p>
          <small>
            支持的网络: Sepolia 测试网 | 
            合约地址: {import.meta.env.VITE_CONTRACT_ADDRESS || '未部署'}
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