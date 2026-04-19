import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getPendingSync, clearPendingSync } from '../lib/db'
import useStore from '../store/useStore'

export function useOfflineSync() {
  const { setIsOnline, setIsSyncing } = useStore()

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      await syncPending()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try sync on mount if online
    if (navigator.onLine) syncPending()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function syncPending() {
    const pending = await getPendingSync()
    if (!pending.length) return

    setIsSyncing(true)
    try {
      for (const action of pending) {
        if (action.type === 'insert_customer') {
          await supabase.from('customers').upsert(action.data)
        } else if (action.type === 'insert_order') {
          await supabase.from('orders').upsert(action.data)
        } else if (action.type === 'mark_paid') {
          await supabase.from('orders')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', action.id)
        }
      }
      await clearPendingSync()
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setIsSyncing(false)
    }
  }
}
