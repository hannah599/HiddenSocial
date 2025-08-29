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
      setMessage('Please enter X account')
      return
    }

    if (!address || !publicClient) {
      setMessage('Please connect your wallet first')
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
        setMessage('Balance query successful')
      } else {
        setBalance('0')
        setMessage('Balance query successful, current balance is 0')
      }
    } catch (error) {
      console.error('Balance query failed:', error)
      // 检查是否是"no data"错误
      if (error instanceof Error && error.message.includes('returned no data')) {
        setBalance('0')
        setMessage('This X account has no balance records')
      } else {
        setMessage('Balance query failed: ' + (error as Error).message)
      }
    } finally {
      setCheckingBalance(false)
    }
  }

  // 提取所有ETH
  const handleWithdrawAll = async () => {
    if (!xAccount.trim()) {
      setMessage('Please enter X account')
      return
    }

    if (!address || !walletClient) {
      setMessage('Please connect your wallet first')
      return
    }

    // 检查是否有余额
    if (!balance || balance === '0') {
      setMessage('This X account has no withdrawable balance')
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

      setMessage(`Withdrawal request submitted: ${hash}`)
      setBalance(null) // 清除余额显示，需要重新查询
    } catch (error) {
      console.error('Withdrawal failed:', error)
      setMessage('Withdrawal failed: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="withdraw-eth">
      <div className="feature-header">
        <div className="feature-icon">💰</div>
        <div className="feature-title">
          <h2>Withdraw ETH</h2>
          <p>Withdraw your encrypted funds securely</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💡</span>
          <strong>How to withdraw</strong>
        </div>
        <ul>
          <li>You can only withdraw ETH sent to your bound X account</li>
          <li>Withdrawal uses FHE decryption for security</li>
          <li>Funds will be sent directly to your wallet address</li>
        </ul>
      </div>
      
      {/* X账号输入和查询 */}
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="xAccount">
            <span className="label-icon">🐦</span>
            X Account
          </label>
          <div className="input-container">
            <input
              id="xAccount"
              type="text"
              value={xAccount}
              onChange={(e) => setXAccount(e.target.value)}
              placeholder="Enter X account (e.g., @username)"
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
            {checkingBalance ? 'Checking...' : 'Check Balance'}
          </span>
          <div className="button-shimmer"></div>
        </button>
      </div>

      {/* 余额显示 */}
      {balance && (
        <div className="balance-section">
          <div className="balance-header">
            <span className="balance-icon">💳</span>
            <h3>Account Balance</h3>
          </div>
          <div className="balance-card">
            <div className="balance-info">
              <div className="balance-row">
                <span className="balance-label">X Account:</span>
                <span className="balance-value account-name">{xAccount}</span>
              </div>
              <div className="balance-row">
                <span className="balance-label">Balance:</span>
                <span className="balance-value eth-amount">
                  {formatEther(BigInt(balance))} ETH
                </span>
              </div>
              <div className="balance-row">
                <span className="balance-label">Wei:</span>
                <span className="balance-value wei-amount">{balance} Wei</span>
              </div>
              <div className="balance-row">
                <span className="balance-label">USD Value:</span>
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
            <h3>Withdraw Funds</h3>
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
              {loading ? 'Withdrawing...' : 'Withdraw All Balance'}
            </span>
            <div className="button-shimmer"></div>
          </button>
          <div className="withdraw-note">
            <span className="note-icon">ℹ️</span>
            All balance from this X account will be withdrawn to your wallet address
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('failed') || message.includes('Please') ? 'error' : 'success'}`}>
          <div className="message-icon">
            {message.includes('failed') || message.includes('Please') ? '❌' : '✅'}
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