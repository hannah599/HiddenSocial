import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { encryptUserAddress } from '@/utils/fhe'
import { useFHEVM } from '@/hooks/useFHEVM'
import { HIDDEN_SOCIAL_ADDRESS, HIDDEN_SOCIAL_ABI } from '@/contracts/config'

export function BindXAccount() {
  const [xAccountId, setXAccountId] = useState('')
  const [targetAddress, setTargetAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { initialized: fheInitialized, loading: fheLoading } = useFHEVM()

  // 验证以太坊地址格式
  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  }

  const handleBind = async () => {
    if (!xAccountId.trim()) {
      setMessage('Please enter X account ID')
      return
    }

    if (!targetAddress.trim()) {
      setMessage('Please enter target address')
      return
    }

    if (!isValidAddress(targetAddress)) {
      setMessage('Please enter a valid Ethereum address (0x...)')
      return
    }
    
    if (!address || !walletClient) {
      setMessage('Please connect your wallet first')
      return
    }

    if (!fheInitialized) {
      setMessage('FHE module not initialized, please try again later')
      return
    }

    setLoading(true)
    setMessage('')

    try {
       console.log("HIDDEN_SOCIAL_ADDRESS:",HIDDEN_SOCIAL_ADDRESS,xAccountId);
      // 加密用户输入的目标地址
      const { handle, proof } = await encryptUserAddress(
        address,
        HIDDEN_SOCIAL_ADDRESS,
        targetAddress
      )

       let formattedHandle: string;
        if (typeof handle === 'string') {
          formattedHandle = handle.startsWith('0x') ? handle : `0x${handle}`;
        } else if (handle instanceof Uint8Array) {
          formattedHandle = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        } else {
          formattedHandle = `0x${handle.toString()}`;
        }

      let formattedProof: string;
        if (typeof proof === 'string') {
          formattedProof = proof.startsWith('0x') ? proof : `0x${proof}`;
        } else if (proof instanceof Uint8Array) {
          formattedProof = `0x${Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        } else {
          formattedProof = `0x${proof.toString()}`;
        }
     
      
      // 调用合约绑定方法
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'bindXAccount',
        args: [xAccountId, formattedHandle, formattedProof],
      })

      setMessage(`Binding transaction submitted: ${hash}`)
      setXAccountId('')
      setTargetAddress('')
    } catch (error) {
      console.error('Binding failed:', error)
      setMessage('Binding failed: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bind-x-account">
      <div className="feature-header">
        <div className="feature-icon">🔗</div>
        <div className="feature-title">
          <h2>Bind X Account</h2>
          <p>Link your X account to a secure encrypted address</p>
        </div>
      </div>
      
      <div className="info-section">
        <div className="info-header">
          <span className="info-icon">💡</span>
          <strong>How it works</strong>
        </div>
        <ul>
          <li>Bind your X account ID to an Ethereum address</li>
          <li>The address is encrypted and stored securely with FHE</li>
          <li>Others can send ETH to your X account, but only you can withdraw</li>
        </ul>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="xAccountId">
            <span className="label-icon">🐦</span>
            X Account ID
          </label>
          <div className="input-container">
            <input
              id="xAccountId"
              type="text"
              value={xAccountId}
              onChange={(e) => setXAccountId(e.target.value)}
              placeholder="Enter your X account ID (e.g., @username)"
              disabled={loading}
              className="modern-input"
            />
            <div className="input-glow"></div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="targetAddress">
            <span className="label-icon">📍</span>
            Target Address
          </label>
          <div className="input-container">
            <input
              id="targetAddress"
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="Enter Ethereum address to bind (0x...)"
              disabled={loading}
              className="modern-input"
            />
            <div className="input-glow"></div>
          </div>
          <div className="input-hint">
            <span className="hint-icon">🔐</span>
            This address will be encrypted and only you can access it
          </div>
        </div>

        <button 
          className="action-button bind-button"
          onClick={handleBind}
          disabled={loading || !address || !fheInitialized || !targetAddress || !xAccountId}
        >
          <span className="button-icon">
            {loading ? '⏳' : fheLoading ? '⏱️' : '🔗'}
          </span>
          <span className="button-text">
            {loading ? 'Binding...' : fheLoading ? 'Waiting for FHE...' : 'Bind X Account'}
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

export default BindXAccount