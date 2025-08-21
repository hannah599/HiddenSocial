import { useState, useEffect } from 'react'
import { initFHEVM, getFHEVMInstance } from '@/utils/fhe'

export function useFHEVM() {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)
        setError(null)
        await initFHEVM()
        setInitialized(true)
        console.log('FHE initialization completed successfully')
      } catch (err) {
        console.error('Failed to initialize FHEVM:', err)
        setError(err as Error)
        setInitialized(false)
      } finally {
        setLoading(false)
      }
    }

    // 延迟一点时间让UI先渲染出来
    const timer = setTimeout(() => {
      initialize()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const getInstance = () => {
    if (!initialized) {
      throw new Error('FHEVM not initialized')
    }
    return getFHEVMInstance()
  }

  return {
    initialized,
    loading,
    error,
    getInstance,
  }
}