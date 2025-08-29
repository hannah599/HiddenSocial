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
      setMessage('Please enter target X account ID')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid ETH amount')
      return
    }
    
    if (!address || !walletClient) {
      setMessage('Please connect your wallet first')
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

      setMessage(`Transaction submitted: ${hash}`)
      setXAccountId('')
      setAmount('')
    } catch (error) {
      console.error('Send failed:', error)
      setMessage('Send failed: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="send-to-x-account">
      <div className="feature-header">
        <div className="feature-icon">💸</div>
        <div className="feature-title">
          <h2>Send ETH to X Account</h2>
          <p>Send ETH to any X account anonymously</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💡</span>
          <strong>How to send</strong>
        </div>
        <ul>
          <li>Send ETH to any bound X account</li>
          <li>Recipient's real address remains encrypted and private</li>
          <li>Only the recipient can withdraw the funds sent to them</li>
        </ul>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="targetXAccountId">
            <span className="label-icon">🎯</span>
            Target X Account ID
          </label>
          <div className="input-container">
            <input
              id="targetXAccountId"
              type="text"
              value={xAccountId}
              onChange={(e) => setXAccountId(e.target.value)}
              placeholder="Enter target X account ID (e.g., @username)"
              disabled={loading}
              className="modern-input"
            />
            <div className="input-glow"></div>
          </div>
          <div className="input-hint">
            <span className="hint-icon">🔍</span>
            Make sure to enter the correct X account ID, funds will be sent to the encrypted address
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ethAmount">
            <span className="label-icon">💰</span>
            ETH Amount
          </label>
          <div className="input-container">
            <input
              id="ethAmount"
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter ETH amount to send"
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
            {loading ? 'Sending...' : 'Send ETH'}
          </span>
          <div className="button-shimmer"></div>
        </button>
      </div>
      
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

export default SendToXAccount