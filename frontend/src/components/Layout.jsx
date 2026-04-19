import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, PlusCircle, LogOut, Droplets, Wifi, WifiOff } from 'lucide-react'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const { t, lang, toggleLang, profile, isOnline, isSyncing } = useStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: t.dashboard, ownerOnly: true },
    { to: '/customers', icon: <Users size={22} />, label: t.customers },
    { to: '/orders', icon: <ClipboardList size={22} />, label: t.orders },
    { to: '/new-order', icon: <PlusCircle size={22} />, label: t.newOrder },
  ]

  const filteredNav = profile?.role === 'owner'
    ? navItems
    : navItems.filter(n => !n.ownerOnly)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <div className="flex items-center gap-2">
          <Droplets size={22} className="text-sky-400" />
          <span className="font-bold text-sky-400">{t.appName}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSyncing ? (
            <span className="text-xs text-yellow-400">{t.syncingData}</span>
          ) : !isOnline ? (
            <WifiOff size={16} className="text-red-400" />
          ) : (
            <Wifi size={16} className="text-green-400" />
          )}
          <button onClick={toggleLang} className="text-xs text-sky-400 border border-sky-400 rounded px-2 py-0.5">
            {lang === 'en' ? 'ខ្មែរ' : 'EN'}
          </button>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-500/20 border-b border-red-500/30 text-red-300 text-xs text-center py-1.5 px-4">
          {t.offlineBanner}
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around py-2 z-10">
        {filteredNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
