import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { saveCustomerOffline, getCustomersOffline, addPendingSync } from '../lib/db'
import useStore from '../store/useStore'
import { Search, Plus, ChevronRight, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function Customers() {
  const { t, isOnline, user, profile } = useStore()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    if (isOnline) {
      const { data } = await supabase.from('customers').select('*').order('name')
      if (data) {
        setCustomers(data)
        data.forEach(c => saveCustomerOffline(c))
      }
    } else {
      const data = await getCustomersOffline()
      setCustomers(data)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setLoading(true)
    const newCustomer = { id: uuidv4(), ...form, created_by: user.id, created_at: new Date().toISOString() }

    if (isOnline) {
      const { error } = await supabase.from('customers').insert(newCustomer)
      if (!error) {
        await saveCustomerOffline(newCustomer)
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)))
        setShowForm(false)
        setForm({ name: '', phone: '', address: '' })
      }
    } else {
      await saveCustomerOffline(newCustomer)
      await addPendingSync({ type: 'insert_customer', data: newCustomer })
      setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)))
      setShowForm(false)
      setForm({ name: '', phone: '', address: '' })
    }
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t.customers}</h2>
        <button onClick={() => setShowForm(true)} className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 transition">
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.searchCustomer}
          className="w-full bg-slate-800 text-white rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">{t.noCustomers}</p>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-700 transition"
            >
              <div>
                <p className="text-white font-medium">{c.name}</p>
                {c.phone && <p className="text-slate-400 text-xs">{c.phone}</p>}
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </div>
          ))
        )}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowForm(false)}>
          <div className="bg-slate-800 w-full rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold">{t.addCustomer}</h3>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder={t.name} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder={t.phone} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                placeholder={t.address} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none" />
              <button type="submit" disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                {loading ? t.loading : t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
