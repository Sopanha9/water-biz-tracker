import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addPendingSync } from '../lib/db'
import useStore from '../store/useStore'
import { CheckCircle, Clock, Filter } from 'lucide-react'

export default function Orders() {
  const { t, isOnline, profile } = useStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, paid, unpaid
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, customers(name, phone), profiles:employee_id(name)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function markPaid(id) {
    const now = new Date().toISOString()
    if (isOnline) {
      await supabase.from('orders').update({ is_paid: true, paid_at: now }).eq('id', id)
    } else {
      await addPendingSync({ type: 'mark_paid', id })
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, is_paid: true, paid_at: now } : o))
    setConfirmId(null)
  }

  const filtered = orders.filter(o => {
    if (filter === 'paid') return o.is_paid
    if (filter === 'unpaid') return !o.is_paid
    return true
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t.orders}</h2>
        <div className="flex gap-1">
          {['all', 'unpaid', 'paid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${filter === f ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {f === 'all' ? '●' : f === 'paid' ? t.paid : t.unpaid}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">{t.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">{t.noOrders}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id} className="bg-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{order.customers?.name}</p>
                  <p className="text-slate-400 text-xs">{order.profiles?.name} · {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-slate-500 text-xs">{order.payment_method === 'cash' ? t.cash : t.abaKhqr}</p>
                  {order.note && <p className="text-slate-500 text-xs italic">{order.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {order.currency === 'USD' ? `$${order.amount_owed}` : `${Number(order.amount_owed).toLocaleString()}៛`}
                  </p>
                  {order.is_paid
                    ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} />{t.paid}</span>
                    : <span className="flex items-center gap-1 text-yellow-400 text-xs"><Clock size={12} />{t.unpaid}</span>
                  }
                </div>
              </div>
              {!order.is_paid && (
                <button onClick={() => setConfirmId(order.id)}
                  className="w-full bg-green-500/20 border border-green-500/40 text-green-400 text-sm py-2 rounded-lg hover:bg-green-500/30 transition">
                  {t.markAsPaid}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white text-center">{t.confirmPaid}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-semibold">{t.no}</button>
              <button onClick={() => markPaid(confirmId)}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold">{t.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
