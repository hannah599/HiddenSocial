import { useState } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { encryptAmount, userDecrypt } from '@/utils/fhe'
import { HIDDEN_SOCIAL_ADDRESS, HIDDEN_SOCIAL_ABI } from '@/contracts/config'

export function WithdrawETH() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [decrypting, setDecrypting] = useState(false)
  const [message, setMessage] = useState('')
  const [balance, setBalance] = useState<string | null>(null)
  
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // 查看加密余额
  const handleCheckBalance = async () => {
    if (!address || !walletClient || !publicClient) {
      setMessage('请先连接钱包')
      return
    }

    setDecrypting(true)
    setMessage('')

    try {
      // 调用合约获取加密余额
      const encryptedBalance = await publicClient.readContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'getBalance',
        args: [address],
      })

      // 解密余额
      const decryptedBalance = await userDecrypt(
        encryptedBalance as string,
        HIDDEN_SOCIAL_ADDRESS,
        walletClient
      )

      setBalance(decryptedBalance.toString())
      setMessage('余额查询成功')
    } catch (error) {
      console.error('查询余额失败:', error)
      setMessage('查询余额失败: ' + (error as Error).message)
    } finally {
      setDecrypting(false)
    }
  }

  // 提取ETH
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('请输入有效的提取金额')
      return
    }
    
    if (!address || !walletClient) {
      setMessage('请先连接钱包')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const ethAmount = parseEther(amount)
      
      // 加密提取金额
      const { handle: encryptedAmount, proof } = await encryptAmount(
        ethAmount,
        HIDDEN_SOCIAL_ADDRESS,
        address
      )

      // 调用合约提取方法
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'withdraw',
        args: [encryptedAmount, proof],
      })

      setMessage(`提取交易已提交: ${hash}`)
      setAmount('')
      setBalance(null) // 清除余额显示，需要重新查询
    } catch (error) {
      console.error('提取失败:', error)
      setMessage('提取失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 批量提取所有余额
  const handleWithdrawAll = async () => {
    if (!address || !walletClient) {
      setMessage('请先连接钱包')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 调用合约批量提取方法
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'batchWithdraw',
        args: [],
      })

      setMessage(`批量提取交易已提交: ${hash}`)
      setAmount('')
      setBalance(null)
    } catch (error) {
      console.error('批量提取失败:', error)
      setMessage('批量提取失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="withdraw-eth">
      <h2>提取ETH</h2>
      
      {/* 余额查询 */}
      <div className="balance-section">
        <button 
          onClick={handleCheckBalance}
          disabled={decrypting || !address}
        >
          {decrypting ? '查询中...' : '查看加密余额'}
        </button>
        {balance && (
          <div className="balance-display">
            <p>当前余额: {balance} Wei</p>
            <p>约 {(BigInt(balance) / BigInt(10**18)).toString()} ETH</p>
          </div>
        )}
      </div>

      {/* 指定金额提取 */}
      <div className="withdraw-section">
        <div className="form-group">
          <label htmlFor="withdrawAmount">提取金额 (ETH):</label>
          <input
            id="withdrawAmount"
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="输入要提取的ETH金额"
            disabled={loading}
          />
        </div>
        <button 
          onClick={handleWithdraw}
          disabled={loading || !address}
        >
          {loading ? '提取中...' : '提取指定金额'}
        </button>
      </div>

      {/* 批量提取 */}
      <div className="batch-withdraw-section">
        <button 
          onClick={handleWithdrawAll}
          disabled={loading || !address}
          className="batch-withdraw-btn"
        >
          {loading ? '提取中...' : '提取所有余额'}
        </button>
        <p className="note">批量提取会将您的所有加密余额一次性提取到钱包</p>
      </div>

      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default WithdrawETH