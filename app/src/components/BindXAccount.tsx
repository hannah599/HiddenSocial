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
      setMessage('请输入X账号ID')
      return
    }

    if (!targetAddress.trim()) {
      setMessage('请输入要绑定的地址')
      return
    }

    if (!isValidAddress(targetAddress)) {
      setMessage('请输入有效的以太坊地址格式 (0x...)')
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

      setMessage(`绑定交易已提交: ${hash}`)
      setXAccountId('')
      setTargetAddress('')
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
      
      <div className="info-section">
        <p><strong>功能说明:</strong></p>
        <ul>
          <li>将你的X账号ID绑定到一个以太坊地址</li>
          <li>该地址将被加密存储，只有拥有该地址私钥的人才能提取资金</li>
          <li>其他人可以向你的X账号发送ETH，但只有你能提取</li>
        </ul>
      </div>
      
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

      <div className="form-group">
        <label htmlFor="targetAddress">要绑定的地址:</label>
        <input
          id="targetAddress"
          type="text"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="输入要绑定的以太坊地址 (0x...)"
          disabled={loading}
        />
        <small style={{ color: '#718096', marginTop: '4px', display: 'block' }}>
          绑定到用户真实地址，这个地址是加密的，其他人无法获取
        </small>
      </div>

      <button 
        onClick={handleBind}
        disabled={loading || !address || !fheInitialized || !targetAddress || !xAccountId}
      >
        {loading ? '绑定中...' : fheLoading ? '等待加密模块...' : '绑定X账号'}
      </button>
      
      {message && (
        <div className={`message ${message.includes('失败') || message.includes('请输入') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default BindXAccount