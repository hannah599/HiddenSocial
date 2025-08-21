import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { encryptXAccountId } from '@/utils/fhe'
import { useFHEVM } from '@/hooks/useFHEVM'
import { HIDDEN_SOCIAL_ADDRESS, HIDDEN_SOCIAL_ABI } from '@/contracts/config'

export function BindXAccount() {
  const [xAccountId, setXAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { initialized: fheInitialized, loading: fheLoading } = useFHEVM()

  const handleBind = async () => {
    if (!xAccountId.trim()) {
      setMessage('请输入X账号ID')
      return
    }
    
    if (!address || !walletClient) {
      setMessage('请先连接钱包')
      return
    }

    if (!fheInitialized) {
      setMessage('加密模块尚未初始化，请稍候再试')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 加密X账号ID
      const { handle, proof } = await encryptXAccountId(
        xAccountId,
        HIDDEN_SOCIAL_ADDRESS,
        address
      )

      // 调用合约绑定方法
      const hash = await walletClient.writeContract({
        address: HIDDEN_SOCIAL_ADDRESS as `0x${string}`,
        abi: HIDDEN_SOCIAL_ABI,
        functionName: 'bindXAccount',
        args: [handle, proof],
      })

      setMessage(`绑定交易已提交: ${hash}`)
      setXAccountId('')
    } catch (error) {
      console.error('绑定失败:', error)
      setMessage('绑定失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bind-x-account">
      <h2>绑定X账号</h2>
      <div className="form-group">
        <label htmlFor="xAccountId">X账号ID:</label>
        <input
          id="xAccountId"
          type="text"
          value={xAccountId}
          onChange={(e) => setXAccountId(e.target.value)}
          placeholder="输入你的X账号ID (例如: @username)"
          disabled={loading}
        />
      </div>
      <button 
        onClick={handleBind}
        disabled={loading || !address || !fheInitialized}
      >
        {loading ? '绑定中...' : fheLoading ? '等待加密模块...' : '绑定X账号'}
      </button>
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default BindXAccount