// @ts-nocheck
// 由于@zama-fhe/relayer-sdk类型定义可能不完整，暂时禁用类型检查

import { ZAMA_CONFIG } from '@/contracts/config'

let fhevmInstance: any = null

/**
 * 初始化FHEVM实例
 */
export async function initFHEVM() {
  try {
    // 动态导入@zama-fhe/relayer-sdk
    const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/bundle')
    
    // 初始化SDK
    await initSDK()
    
    // 创建实例
    const config = {
      ...SepoliaConfig,
      network: window.ethereum,
    }
    
    fhevmInstance = await createInstance(config)
    
    console.log('FHEVM initialized successfully')
    return fhevmInstance
  } catch (error) {
    console.error('Failed to initialize FHEVM:', error)
    throw error
  }
}

/**
 * 获取FHEVM实例
 */
export function getFHEVMInstance() {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initFHEVM() first.')
  }
  return fhevmInstance
}

/**
 * 加密用户地址用于绑定X账号
 */
export async function encryptUserAddress(userAddress: string, contractAddress: string,bindAddress:string) {
  const instance = getFHEVMInstance()
  
  // 创建加密输入缓冲区
  const buffer = instance.createEncryptedInput(contractAddress, userAddress)
  
  // 添加地址到缓冲区
  buffer.addAddress(bindAddress)
  
  // 加密
  const encryptedInput = await buffer.encrypt()
  
  return {
    handle: encryptedInput.handles[0],
    proof: encryptedInput.inputProof,
  }
}

/**
 * 加密ETH金额
 */
export async function encryptAmount(amount: bigint, contractAddress: string, userAddress: string) {
  const instance = getFHEVMInstance()
  
  const buffer = instance.createEncryptedInput(contractAddress, userAddress)
  buffer.add64(amount)
  
  const encryptedInput = await buffer.encrypt()
  
  return {
    handle: encryptedInput.handles[0],
    proof: encryptedInput.inputProof,
  }
}

/**
 * 用户解密
 */
export async function userDecrypt(
  ciphertextHandle: string,
  contractAddress: string,
  signer: any
) {
  const instance = getFHEVMInstance()
  
  // 生成密钥对
  const keypair = instance.generateKeypair()
  
  const handleContractPairs = [
    {
      handle: ciphertextHandle,
      contractAddress: contractAddress,
    },
  ]
  
  const startTimeStamp = Math.floor(Date.now() / 1000).toString()
  const durationDays = '10'
  const contractAddresses = [contractAddress]
  
  // 创建EIP712消息
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  )
  
  // 签名
  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message
  )
  
  // 解密
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    signer.address,
    startTimeStamp,
    durationDays
  )
  
  return result[ciphertextHandle]
}

/**
 * 公开解密
 */
export async function publicDecrypt(handles: string[]) {
  const instance = getFHEVMInstance()
  return await instance.publicDecrypt(handles)
}

/**
 * 简单字符串哈希函数
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString()
}