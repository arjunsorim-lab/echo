import api from '../api/axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  FileText,
  Link2,
  Lock,
  Mail,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
  CheckCircle2,
  Heart,
  Activity,
  Stethoscope,
} from 'lucide-react'
import EchoLogo from '../components/EchoLogo'

const demoUsers = [
  {
    name: 'Dr Shanthi',
    role: 'Founder',
    email: 'dr.shanthi@echoai.com',
    userName: 'dr.shanthi',

  },
]

function PlatformTemplate() {
  return <section className="hidden rounded-[2rem] border bg-blue-50 p-10 lg:flex lg:flex-col lg:justify-center"><EchoLogo/><h1 className="my-6 text-3xl font-bold text-slate-900">Echo reporting workspace</h1><p className="text-lg text-slate-700">Register patients, manage visits, enter findings and review reports.</p><ul className="mt-8 space-y-4 text-slate-700"><li>Adult, Fetal and Paediatric Echo reporting</li><li>Draft saving, authorised audit and final completion</li><li>Visit-linked file upload and report previews</li></ul><p className="mt-8 text-sm text-slate-600">Clinical calculations and scanner integration require approved configuration.</p></section>
}

function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [signingIn,setSigningIn]=useState(false)


  const useDemoUser = (user = demoUsers[0]) => {
    setEmail(user.email)
    setPassword('')
    setError('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    if(signingIn)return
    setSigningIn(true)
    try {
      const result = (await api.post('/auth/login', { username: email.trim(), password, remember })).data
      const storage = remember ? localStorage : sessionStorage
      const other = remember ? sessionStorage : localStorage
      other.removeItem('echoai_user'); other.removeItem('echoai_token')
      storage.setItem('echoai_user', JSON.stringify(result.user)); storage.setItem('echoai_token', result.token)
      navigate('/dashboard', { replace: true })
    } catch (error) { setError(error.response?.data?.detail || 'Unable to sign in. Check the backend connection.') } finally {setSigningIn(false)}
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-3 text-slate-900 sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_410px]">
        <PlatformTemplate />

        {/* ── LOGIN PANEL ── */}
        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[2rem] border border-slate-200 bg-white px-7 py-6 text-[#08145f] shadow-xl shadow-slate-300/40">
          <EchoLogo compact />

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-black text-[#08145f]">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to manage patients, visits and reports.</p>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleLogin}>
            <label className="block">
              <span className="text-sm font-semibold text-[#08145f]">Email Address</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Email address or username"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#08145f]">Password</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded p-1 hover:bg-slate-100 text-slate-400" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                Remember me
              </label>
              <button type="button" onClick={() => setError('Ask your account administrator to reset your password.')} className="font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
            )}

            <button type="submit" disabled={signingIn} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <Zap className="h-4 w-4" />
              {signingIn ? 'Signing in…' : 'Login'}
            </button>
          </form>

          {/* ── FOUNDER ACCESS CARD ── */}
          <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Founder Access</p>
            </div>
            <button
              type="button"
              onClick={() => useDemoUser()}
              className="w-full rounded-xl border border-blue-100 bg-white px-3.5 py-3 text-left shadow-xs transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  DS
                </div>
                <div>
                  <p className="text-sm font-bold text-[#08145f]">Dr Shanthi · Founder</p>
                  <p className="text-[11px] text-slate-500">dr.shanthi@echoai.com</p>
                </div>
              </div>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
