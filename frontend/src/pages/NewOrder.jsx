import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { saveOrderOffline, getCustomersOffline, addPendingSync } from '../lib/db'
import useStore from '../store/useStore'
import { Search, ArrowLeft } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function NewOrder() {
  const { t, isOnline, user } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=select customer, 2=order details
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' })
  const [form, setForm] = useState({ amount_owed: '', currency: 'KHR', payment_method: 'cash', note: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    if (isOnline) {
      const { data } = await supabase.from('customers').select('*').order('name')
      if (data) setCustomers(data)
    } else {
      const data = await getCustomersOffline()
      setCustomers(data)
    }
  }

  async function handleCreateCustomer(e) {
    e.preventDefault()
    const c = { id: uuidv4(), ...newCustomer, created_by: user.id, created_at: new Date().toISOString() }
    if (isOnline) {
      await supabase.from('customers').insert(c)
    } else {
      await addPendingSync({ type: 'insert_customer', data: c })
    }
    setCustomers(prev => [...prev, c])
    setSelected(c)
    setShowNewCustomer(false)
    setStep(2)
  }

  async function handleSubmitOrder(e) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    const order = {
      id: uuidv4(),
      customer_id: selected.id,
      employee_id: user.id,
      amount_owed: parseFloat(form.amount_owed),
      currency: form.currency,
      payment_method: form.payment_method,
      note: form.note,
      is_paid: false,
      created_at: new Date().toISOString()
    }
    if (isOnline) {
      await supabase.from('orders').insert(order)
    } else {
      await saveOrderOffline(order)
      await addPendingSync({ type: 'insert_order', data: order })
    }
    setLoading(false)
    setSuccess(true)
    setTimeout(() => navigate('/orders'), 1500)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="text-5xl">✅</div>
        <p className="text-green-400 font-semibold">{t.save}d!</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => step === 2 ? setStep(1) : navigate(-1)} className="text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white">{t.newOrder}</h2>
      </div>

      {step === 1 && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchCustomer}
              className="w-full bg-slate-800 text-white rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <button onClick={() => setShowNewCustomer(true)}
            className="w-full border-2 border-dashed border-slate-600 text-slate-400 rounded-xl py-3 text-sm hover:border-sky-500 hover:text-sky-400 transition">
            + {t.createNew}
          </button>

          {showNewCustomer && (
            <form onSubmit={handleCreateCustomer} className="bg-slate-800 rounded-2xl p-4 space-y-3">
              <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder={t.name} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder={t.phone} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                placeholder={t.address} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <button type="submit" className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold">{t.save}</button>
            </form>
          )}

          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} onClick={() => { setSelected(c); setStep(2) }}
                className="bg-slate-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-700 transition">
                <p className="text-white font-medium">{c.name}</p>
                {c.phone && <p className="text-slate-400 text-xs">{c.phone}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && selected && (
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          <div className="bg-sky-500/20 border border-sky-500/30 rounded-xl px-4 py-3">
            <p className="text-sky-300 font-semibold">{selected.name}</p>
            {selected.phone && <p className="text-sky-400 text-xs">{selected.phone}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.amountOwed}</label>
            <input required type="number" step="0.01" value={form.amount_owed}
              onChange={e => setForm({...form, amount_owed: e.target.value})}
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.currency}</label>
            <div className="flex gap-3">
              {['KHR', 'USD'].map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, currency: c})}
                  className={`flex-1 py-3 rounded-xl font-semibold transition ${form.currency === c ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {c === 'KHR' ? t.khr : t.usd}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.paymentMethod}</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({...form, payment_method: 'cash'})}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${form.payment_method === 'cash' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {t.cash}
              </button>
              <button type="button" onClick={() => setForm({...form, payment_method: 'aba_khqr'})}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${form.payment_method === 'aba_khqr' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {t.abaKhqr}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.note}</label>
            <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={2}
              className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 outline-none resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50">
            {loading ? t.loading : t.submit}
          </button>
        </form>
      )}
    </div>
  )
}
