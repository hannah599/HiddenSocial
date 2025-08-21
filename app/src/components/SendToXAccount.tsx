import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { HIDDEN_SOCIAL_ADDRESS, HIDDEN_SOCIAL_ABI } from '@/contracts/config'

export function SendToXAccount() {
  const [xAccountId, setXAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()

  const handleSend = async () => {
    if (!xAccountId.trim()) {
      setMessage('请输入目标X账号ID')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('请输入有效的ETH金额')
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

      // 调用合约发送方法 - sendToXAccount只需要xAccountId字符串和ETH value
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'sendToXAccount',
        args: [xAccountId], // 只传递xAccountId字符串
        value: ethAmount, // 发送实际的ETH
      })

      setMessage(`发送交易已提交: ${hash}`)
      setXAccountId('')
      setAmount('')
    } catch (error) {
      console.error('发送失败:', error)
      setMessage('发送失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="send-to-x-account">
      <h2>向X账号发送ETH</h2>
      <div className="form-group">
        <label htmlFor="targetXAccountId">目标X账号ID:</label>
        <input
          id="targetXAccountId"
          type="text"
          value={xAccountId}
          onChange={(e) => setXAccountId(e.target.value)}
          placeholder="输入目标X账号ID (例如: @username)"
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="ethAmount">ETH金额:</label>
        <input
          id="ethAmount"
          type="number"
          step="0.001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="输入要发送的ETH金额"
          disabled={loading}
        />
      </div>
      <button 
        onClick={handleSend}
        disabled={loading || !address}
      >
        {loading ? '发送中...' : '发送ETH'}
      </button>
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default SendToXAccount