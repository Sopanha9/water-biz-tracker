import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useStore()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const { data: c } = await supabase.from('customers').select('*').eq('id', id).single()
    const { data: o } = await supabase.from('orders').select('*, profiles:employee_id(name)')
      .eq('customer_id', id).order('created_at', { ascending: false })
    setCustomer(c)
    setOrders(o || [])
  }

  if (!customer) return <div className="p-4 text-slate-400">{t.loading}</div>

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400">
        <ArrowLeft size={18} /> {t.back}
      </button>

      <div className="bg-slate-800 rounded-2xl p-4">
        <h2 className="text-xl font-bold text-white">{customer.name}</h2>
        {customer.phone && <p className="text-slate-400 text-sm">{customer.phone}</p>}
        {customer.address && <p className="text-slate-400 text-sm">{customer.address}</p>}
      </div>

      <h3 className="text-sm font-semibold text-slate-300">{t.orderHistory}</h3>
      {orders.length === 0 ? (
        <p className="text-slate-500 text-sm">{t.noOrders}</p>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-medium">
                  {o.currency === 'USD' ? `$${o.amount_owed}` : `${Number(o.amount_owed).toLocaleString()}៛`}
                </p>
                <p className="text-slate-400 text-xs">{o.profiles?.name} · {new Date(o.created_at).toLocaleDateString()} · {o.payment_method === 'cash' ? t.cash : t.abaKhqr}</p>
                {o.note && <p className="text-slate-500 text-xs">{o.note}</p>}
              </div>
              {o.is_paid
                ? <CheckCircle size={18} className="text-green-400" />
                : <Clock size={18} className="text-yellow-400" />
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
