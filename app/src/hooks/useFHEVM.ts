import { useState, useEffect } from 'react'
import { initFHEVM, getFHEVMInstance } from '@/utils/fhe'

export function useFHEVM() {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initFHEVM()
        setInitialized(true)
        setError(null)
      } catch (err) {
        console.error('Failed to initialize FHEVM:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    initialize()
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