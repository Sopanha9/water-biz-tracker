import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'
import { TrendingUp, AlertCircle, Users, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const { t, profile } = useStore()
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, unpaidCount: 0, unpaidAmount: 0 })
  const [unpaidOrders, setUnpaidOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [employees, setEmployees] = useState([])

  useEffect(() => { fetchStats(); fetchEmployees() }, [filter])

  async function fetchEmployees() {
    const { data } = await supabase.from('profiles').select('id, name').eq('role', 'employee')
    if (data) setEmployees(data)
  }

  async function fetchStats() {
    setLoading(true)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    let query = supabase.from('orders').select('*, customers(name), profiles:employee_id(name)')
    if (filter !== 'all') query = query.eq('employee_id', filter)

    const { data: orders } = await query
    if (!orders) { setLoading(false); return }

    const paid = orders.filter(o => o.is_paid)
    const unpaid = orders.filter(o => !o.is_paid)

    const sumUSD = (list) => list.filter(o => o.currency === 'USD').reduce((s, o) => s + Number(o.amount_owed), 0)
    const sumKHR = (list) => list.filter(o => o.currency === 'KHR').reduce((s, o) => s + Number(o.amount_owed), 0)

    setStats({
      todayUSD: sumUSD(paid.filter(o => o.paid_at >= todayStart)),
      todayKHR: sumKHR(paid.filter(o => o.paid_at >= todayStart)),
      weekUSD: sumUSD(paid.filter(o => o.paid_at >= weekStart)),
      weekKHR: sumKHR(paid.filter(o => o.paid_at >= weekStart)),
      monthUSD: sumUSD(paid.filter(o => o.paid_at >= monthStart)),
      monthKHR: sumKHR(paid.filter(o => o.paid_at >= monthStart)),
      unpaidCount: unpaid.length,
      unpaidUSD: sumUSD(unpaid),
      unpaidKHR: sumKHR(unpaid),
    })
    setUnpaidOrders(unpaid.slice(0, 20))
    setLoading(false)
  }

  const fmt = (usd, khr) => {
    const parts = []
    if (usd > 0) parts.push(`$${usd.toFixed(2)}`)
    if (khr > 0) parts.push(`${khr.toLocaleString()}៛`)
    return parts.length ? parts.join(' + ') : '$0'
  }

  const StatCard = ({ label, usd, khr, icon, color }) => (
    <div className={`bg-slate-800 rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-bold text-white text-sm">{fmt(usd, khr)}</p>
      </div>
    </div>
  )

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-bold text-white">{t.dashboard}</h2>

      {/* Employee filter */}
      <select
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700"
      >
        <option value="all">{t.allEmployees}</option>
        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      {loading ? (
        <p className="text-slate-400 text-sm">{t.loading}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t.today} usd={stats.todayUSD} khr={stats.todayKHR} icon={<DollarSign size={18} className="text-green-400" />} color="bg-green-500/20" />
            <StatCard label={t.thisWeek} usd={stats.weekUSD} khr={stats.weekKHR} icon={<TrendingUp size={18} className="text-sky-400" />} color="bg-sky-500/20" />
            <StatCard label={t.thisMonth} usd={stats.monthUSD} khr={stats.monthKHR} icon={<TrendingUp size={18} className="text-purple-400" />} color="bg-purple-500/20" />
            <StatCard label={t.totalUnpaid} usd={stats.unpaidUSD} khr={stats.unpaidKHR} icon={<AlertCircle size={18} className="text-red-400" />} color="bg-red-500/20" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2">{t.unpaidOrders} ({stats.unpaidCount})</h3>
            {unpaidOrders.length === 0 ? (
              <p className="text-slate-500 text-sm">{t.noOrders}</p>
            ) : (
              <div className="space-y-2">
                {unpaidOrders.map(order => (
                  <div key={order.id} className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm font-medium">{order.customers?.name}</p>
                      <p className="text-slate-400 text-xs">{order.profiles?.name} · {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-red-400 font-semibold text-sm">
                      {order.currency === 'USD' ? `$${order.amount_owed}` : `${Number(order.amount_owed).toLocaleString()}៛`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
