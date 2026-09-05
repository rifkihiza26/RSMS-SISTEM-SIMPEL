import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'


export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email atau password salah. Silakan coba lagi.')
      setLoading(false)
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5"><img src="/logo.png" alt="Rakyat Sinting Matic Shop" className="h-24 w-24 rounded-2xl object-cover shadow-sm" /></div>
          <h1 className="text-2xl font-bold text-zinc-100">Rakyat Sinting Matic Shop</h1>
          <p className="text-sm text-zinc-400 mt-1">Sistem Kasir & Operasional</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">Masuk ke Sistem</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="admin@rsms.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
