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
      <div className="feature-header">
        <div className="feature-icon">💸</div>
        <div className="feature-title">
          <h2>向X账号发送ETH</h2>
          <p>Send ETH to any X account anonymously</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💡</span>
          <strong>发送说明</strong>
        </div>
        <ul>
          <li>向任何已绑定的X账号发送ETH</li>
          <li>接收者的真实地址保持加密隐私</li>
          <li>只有接收者本人能提取发送给他的资金</li>
        </ul>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="targetXAccountId">
            <span className="label-icon">🎯</span>
            目标X账号ID
          </label>
          <div className="input-container">
            <input
              id="targetXAccountId"
              type="text"
              value={xAccountId}
              onChange={(e) => setXAccountId(e.target.value)}
              placeholder="输入目标X账号ID (例如: @username)"
              disabled={loading}
              className="modern-input"
            />
            <div className="input-glow"></div>
          </div>
          <div className="input-hint">
            <span className="hint-icon">🔍</span>
            确保输入正确的X账号ID，资金将发送到该账号绑定的加密地址
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ethAmount">
            <span className="label-icon">💰</span>
            ETH金额
          </label>
          <div className="input-container">
            <input
              id="ethAmount"
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入要发送的ETH金额"
              disabled={loading}
              className="modern-input amount-input"
            />
            <div className="input-glow"></div>
            <div className="currency-badge">ETH</div>
          </div>
          <div className="amount-converter">
            {amount && !isNaN(parseFloat(amount)) && (
              <span className="converted-amount">
                ≈ ${(parseFloat(amount) * 2000).toFixed(2)} USD
              </span>
            )}
          </div>
        </div>

        <button 
          className="action-button send-button"
          onClick={handleSend}
          disabled={loading || !address || !xAccountId.trim() || !amount || parseFloat(amount) <= 0}
        >
          <span className="button-icon">
            {loading ? '⏳' : '💸'}
          </span>
          <span className="button-text">
            {loading ? '发送中...' : '发送ETH'}
          </span>
          <div className="button-shimmer"></div>
        </button>
      </div>
      
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

export default SendToXAccount