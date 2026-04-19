import { useState } from 'react'
import { supabase } from '../lib/supabase'
import useStore from '../store/useStore'
import { Droplets } from 'lucide-react'

export default function Login() {
  const { t, lang, toggleLang } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 text-sm text-sky-400 border border-sky-400 rounded px-3 py-1"
      >
        {lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}
      </button>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-500 p-4 rounded-full mb-3">
            <Droplets size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t.appName}</h1>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? t.loading : t.login}
          </button>
        </form>
      </div>
    </div>
  )
}
