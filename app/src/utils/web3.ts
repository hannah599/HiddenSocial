import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// 应用信息
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id'

// 创建wagmi配置
export const config = getDefaultConfig({
  appName: 'Hidden Social',
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_RPC_URL),
  },
})

// 链配置
export const supportedChains = [sepolia]