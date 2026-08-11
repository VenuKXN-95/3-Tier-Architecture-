/**
 * UserPage — create a demo user and display user info.
 * In this initial version, user management is simplified.
 * The created user's ID is stored in localStorage for demo purposes.
 * A real app would use authentication tokens.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Key, CheckCircle } from 'lucide-react'
import { usersApi } from '@/services/api'
import type { User as UserType } from '@/types'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { useData } from '@/hooks/useData'

const STORAGE_KEY = 'demo_user_id'

export function UserPage() {
  const storedUserId = localStorage.getItem(STORAGE_KEY) ?? ''
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState(storedUserId)

  const { data: user, loading, error, refetch } = useData<UserType>(
    () => (currentUserId ? usersApi.get(currentUserId) : Promise.reject(new Error('No user'))),
    [currentUserId],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    try {
      if (mode === 'login') {
        const res = await usersApi.login({ email, password })
        localStorage.setItem('access_token', res.access_token)
        localStorage.setItem(STORAGE_KEY, res.user.id)
        setCurrentUserId(res.user.id)
        refetch()
      } else {
        const created = await usersApi.create({ name, email, password })
        // After creation, login to get JWT token
        const loginRes = await usersApi.login({ email, password })
        localStorage.setItem('access_token', loginRes.access_token)
        localStorage.setItem(STORAGE_KEY, created.id)
        setCurrentUserId(created.id)
        refetch()
      }
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('access_token')
    setCurrentUserId('')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-text-1 flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-violet-bright" aria-hidden="true" />
        Profile & Authentication
      </h1>

      {/* Current user profile */}
      {loading && currentUserId && <Loading message="Loading profile…" />}
      {(error && currentUserId) && (
        <ErrorMessage message="Could not load user profile." className="mb-4" />
      )}

      {user && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet/15 border border-violet/20 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-bright" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-text-1">{user.name}</p>
              <p className="text-xs text-text-3">{user.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 border border-success/20 px-2 py-1 rounded-md">
                <CheckCircle className="w-3 h-3" aria-hidden="true" />
                JWT Authenticated
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-text-3">
            <div>
              <span className="text-text-4">User ID</span>
              <br />
              <span className="font-mono text-text-2">{user.id}</span>
            </div>
            <div>
              <span className="text-text-4">Joined</span>
              <br />
              {formatDate(user.created_at)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Login / Register form */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-border p-6"
        >
          {/* Tabs */}
          <div className="flex border-b border-white/[0.08] mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null) }}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-violet-bright text-text-1'
                  : 'border-transparent text-text-3 hover:text-text-2'
              }`}
            >
              Sign In (JWT)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null) }}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-violet-bright text-text-1'
                  : 'border-transparent text-text-3 hover:text-text-2'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Name field (Register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="user-name" className="block text-xs font-medium text-text-2 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-3" aria-hidden="true" />
                  <input
                    id="user-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Venu"
                    className="w-full bg-canvas-2 border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:border-violet/50 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="user-email" className="block text-xs font-medium text-text-2 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-3" aria-hidden="true" />
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="venu@example.com"
                  className="w-full bg-canvas-2 border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:border-violet/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="user-password" className="block text-xs font-medium text-text-2 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-3" aria-hidden="true" />
                <input
                  id="user-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-canvas-2 border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-text-1 placeholder:text-text-4 focus:outline-none focus:border-violet/50 transition-colors"
                />
              </div>
            </div>

            {errorMsg && <ErrorMessage message={errorMsg} />}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              aria-label={mode === 'login' ? 'Sign In' : 'Create Account'}
            >
              {mode === 'login' ? 'Sign In & Get JWT Token' : 'Create Account'}
            </Button>
          </form>
        </motion.div>
      )}
    </div>
  )
}

