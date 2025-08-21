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
        <h1>🕵️ Hidden Social</h1>
        <p>基于同态加密的匿名社交支付平台</p>
        
        {/* FHE 状态指示器 */}
        <div className="fhe-status">
          {loading && (
            <div className="status-indicator loading">
              <span className="spinner">⏳</span>
              <span>正在初始化加密模块...</span>
            </div>
          )}
          {error && (
            <div className="status-indicator error">
              <span>❌</span>
              <span>加密模块初始化失败: {error.message}</span>
              <button onClick={() => window.location.reload()} className="retry-btn">重试</button>
            </div>
          )}
          {initialized && (
            <div className="status-indicator success">
              <span>✅</span>
              <span>加密模块已就绪</span>
            </div>
          )}
        </div>
        
        <WalletConnect />
      </header>

      <main className="app-main">
        <nav className="tab-nav">
          <button 
            className={activeTab === 'bind' ? 'active' : ''} 
            onClick={() => setActiveTab('bind')}
          >
            绑定 X 账号
          </button>
          <button 
            className={activeTab === 'send' ? 'active' : ''} 
            onClick={() => setActiveTab('send')}
          >
            发送 ETH
          </button>
          <button 
            className={activeTab === 'withdraw' ? 'active' : ''} 
            onClick={() => setActiveTab('withdraw')}
          >
            提取 ETH
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