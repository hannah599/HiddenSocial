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
      console.log("getBalance:",balanceWei);
      
      setBalance(balanceWei.toString())
      setMessage('余额查询成功')
    } catch (error) {
      console.error('查询余额失败:', error)
      setMessage('查询余额失败: ' + (error as Error).message)
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
      <h2>提取ETH</h2>
      
      {/* X账号输入 */}
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="xAccount">X账号:</label>
          <input
            id="xAccount"
            type="text"
            value={xAccount}
            onChange={(e) => setXAccount(e.target.value)}
            placeholder="输入X账号 (例如: @username)"
            disabled={loading || checkingBalance}
          />
        </div>
        <button 
          onClick={handleCheckBalance}
          disabled={checkingBalance || !address || !xAccount.trim()}
        >
          {checkingBalance ? '查询中...' : '查看余额'}
        </button>
      </div>

      {/* 余额显示 */}
      {balance && (
        <div className="balance-display">
          <h3>X账号: {xAccount}</h3>
          <p>当前余额: {balance} Wei</p>
          <p>约 {formatEther(BigInt(balance))} ETH</p>
        </div>
      )}

      {/* 提取所有余额 */}
      {balance && balance !== '0' && (
        <div className="withdraw-section">
          <button 
            onClick={handleWithdrawAll}
            disabled={loading || !address}
            className="withdraw-all-btn"
          >
            {loading ? '提取中...' : '提取所有余额'}
          </button>
          <p className="note">将会提取该X账号的所有余额到您的钱包地址</p>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default WithdrawETH