import { useState } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { HIDDEN_SOCIAL_ADDRESS, HIDDEN_SOCIAL_ABI } from '@/contracts/config'

export function WithdrawETH() {
  const [xAccount, setXAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingBalance, setCheckingBalance] = useState(false)
  const [message, setMessage] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // 查看X账号余额
  const handleCheckBalance = async () => {
    if (!xAccount.trim()) {
      setMessage('请输入X账号')
      return
    }

    if (!address || !publicClient) {
      setMessage('请先连接钱包')
      return
    }

    // 调试信息
    console.log('Contract address:', HIDDEN_SOCIAL_ADDRESS)
    console.log('RPC URL:', import.meta.env.VITE_RPC_URL)
    console.log('Public client:', publicClient)

    setCheckingBalance(true)
    setMessage('')
    setBalance(null)

    try {
      // 调用合约获取余额
      const balanceWei = await publicClient.readContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'getBalance',
        args: [xAccount.trim()],
      }) as bigint
      
      console.log("getBalance result:", balanceWei)
      console.log("getBalance type:", typeof balanceWei)
      
      if (balanceWei !== undefined && balanceWei !== null) {
        setBalance(balanceWei.toString())
        setMessage('余额查询成功')
      } else {
        setBalance('0')
        setMessage('余额查询成功，当前余额为0')
      }
    } catch (error) {
      console.error('查询余额失败:', error)
      // 检查是否是"no data"错误
      if (error instanceof Error && error.message.includes('returned no data')) {
        setBalance('0')
        setMessage('该X账号暂无余额记录')
      } else {
        setMessage('查询余额失败: ' + (error as Error).message)
      }
    } finally {
      setCheckingBalance(false)
    }
  }

  // 提取所有ETH
  const handleWithdrawAll = async () => {
    if (!xAccount.trim()) {
      setMessage('请输入X账号')
      return
    }

    if (!address || !walletClient) {
      setMessage('请先连接钱包')
      return
    }

    // 检查是否有余额
    if (!balance || balance === '0') {
      setMessage('该X账号没有可提取的余额')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 调用合约提取方法
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'requestWithdrawal',
        args: [xAccount.trim()],
      })

      setMessage(`提取请求已提交: ${hash}`)
      setBalance(null) // 清除余额显示，需要重新查询
    } catch (error) {
      console.error('提取失败:', error)
      setMessage('提取失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="withdraw-eth">
      <div className="feature-header">
        <div className="feature-icon">💰</div>
        <div className="feature-title">
          <h2>提取ETH</h2>
          <p>Withdraw your encrypted funds securely</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💡</span>
          <strong>提取说明</strong>
        </div>
        <ul>
          <li>只能提取发送给您绑定X账号的ETH</li>
          <li>提取过程使用FHE解密确保安全性</li>
          <li>资金将直接发送到您的钱包地址</li>
        </ul>
      </div>
      
      {/* X账号输入和查询 */}
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="xAccount">
            <span className="label-icon">🐦</span>
            X账号
          </label>
          <div className="input-container">
            <input
              id="xAccount"
              type="text"
              value={xAccount}
              onChange={(e) => setXAccount(e.target.value)}
              placeholder="输入X账号 (例如: @username)"
              disabled={loading || checkingBalance}
              className="modern-input"
            />
            <div className="input-glow"></div>
          </div>
        </div>
        
        <button 
          className="action-button check-balance-button"
          onClick={handleCheckBalance}
          disabled={checkingBalance || !address || !xAccount.trim()}
        >
          <span className="button-icon">
            {checkingBalance ? '⏳' : '🔍'}
          </span>
          <span className="button-text">
            {checkingBalance ? '查询中...' : '查看余额'}
          </span>
          <div className="button-shimmer"></div>
        </button>
      </div>

      {/* 余额显示 */}
      {balance && (
        <div className="balance-section">
          <div className="balance-header">
            <span className="balance-icon">💳</span>
            <h3>账号余额</h3>
          </div>
          <div className="balance-card">
            <div className="balance-info">
              <div className="balance-row">
                <span className="balance-label">X账号:</span>
                <span className="balance-value account-name">{xAccount}</span>
              </div>
              <div className="balance-row">
                <span className="balance-label">余额:</span>
                <span className="balance-value eth-amount">
                  {formatEther(BigInt(balance))} ETH
                </span>
              </div>
              <div className="balance-row">
                <span className="balance-label">详细:</span>
                <span className="balance-value wei-amount">{balance} Wei</span>
              </div>
              <div className="balance-row">
                <span className="balance-label">估值:</span>
                <span className="balance-value usd-amount">
                  ≈ ${(parseFloat(formatEther(BigInt(balance))) * 2000).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提取操作 */}
      {balance && balance !== '0' && (
        <div className="withdraw-section">
          <div className="withdraw-header">
            <span className="withdraw-icon">🏦</span>
            <h3>提取资金</h3>
          </div>
          <button 
            onClick={handleWithdrawAll}
            disabled={loading || !address}
            className="action-button withdraw-button"
          >
            <span className="button-icon">
              {loading ? '⏳' : '💰'}
            </span>
            <span className="button-text">
              {loading ? '提取中...' : '提取所有余额'}
            </span>
            <div className="button-shimmer"></div>
          </button>
          <div className="withdraw-note">
            <span className="note-icon">ℹ️</span>
            将会提取该X账号的所有余额到您的钱包地址
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('失败') || message.includes('请输入') ? 'error' : 'success'}`}>
          <div className="message-icon">
            {message.includes('失败') || message.includes('请输入') ? '❌' : '✅'}
          </div>
          <div className="message-content">
            {message}
          </div>
        </div>
      )}
    </div>
  )
}

export default WithdrawETH