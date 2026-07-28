import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const demoUsers = [
  {
    name: 'Dr Shanthi',
    role: 'Founder',
    email: 'dr.shanthi@echoai.com',
    userName: 'dr.shanthi',
    password: 'password123',
  },
]

const pipelineSteps = [
  {
    number: '1',
    title: 'Connect',
    copy: 'Securely connect your data in seconds',
    badge: 'bg-blue-500',
    glow: 'shadow-blue-500/40',
    border: 'hover:border-blue-400/50',
    iconBg: 'from-blue-500 to-indigo-600',
    accentText: 'text-blue-400',
    icon: Database,
    subIcon: Link2,
    subBg: 'bg-emerald-500',
  },
  {
    number: '2',
    title: 'Ingest',
    copy: 'Capture and unify your data',
    badge: 'bg-emerald-500',
    glow: 'shadow-emerald-500/40',
    border: 'hover:border-emerald-400/50',
    iconBg: 'from-emerald-400 to-teal-600',
    accentText: 'text-emerald-400',
    icon: Upload,
    subIcon: CheckCircle2,
    subBg: 'bg-teal-500',
  },
  {
    number: '3',
    title: 'Analyze',
    copy: 'Detect patterns and key insights',
    badge: 'bg-purple-500',
    glow: 'shadow-purple-500/40',
    border: 'hover:border-purple-400/50',
    iconBg: 'from-purple-500 to-indigo-700',
    accentText: 'text-purple-400',
    icon: Search,
    subIcon: BarChart3,
    subBg: 'bg-violet-500',
  },
  {
    number: '4',
    title: 'Report',
    copy: 'Generate reports instantly',
    badge: 'bg-sky-500',
    glow: 'shadow-sky-500/40',
    border: 'hover:border-sky-400/50',
    iconBg: 'from-sky-400 to-blue-600',
    accentText: 'text-sky-400',
    icon: FileText,
    subIcon: FileText,
    subBg: 'bg-blue-500',
  },
  {
    number: '5',
    title: 'Act',
    copy: 'Take action with confidence',
    badge: 'bg-teal-500',
    glow: 'shadow-teal-500/40',
    border: 'hover:border-teal-400/50',
    iconBg: 'from-teal-400 to-emerald-600',
    accentText: 'text-teal-400',
    icon: Rocket,
    subIcon: Sparkles,
    subBg: 'bg-emerald-500',
  },
  {
    number: '6',
    title: 'Impact',
    copy: 'Drive better outcomes together',
    badge: 'bg-indigo-500',
    glow: 'shadow-indigo-500/40',
    border: 'hover:border-indigo-400/50',
    iconBg: 'from-indigo-400 to-violet-700',
    accentText: 'text-indigo-400',
    icon: Users,
    subIcon: Sparkles,
    subBg: 'bg-yellow-500',
  },
]

const bottomFeatures = [
  { title: 'All Your Data', copy: 'Connect any source', icon: Link2, color: 'from-blue-500 to-indigo-600' },
  { title: 'Any Format', copy: 'Structured & unstructured', icon: Upload, color: 'from-emerald-400 to-teal-600' },
  { title: 'AI-Powered Insights', copy: 'Smarter analysis', icon: BarChart3, color: 'from-purple-500 to-violet-700' },
  { title: 'Clear & Actionable', copy: 'Reports that drive decisions', icon: FileText, color: 'from-sky-400 to-blue-600' },
  { title: 'Enterprise Ready', copy: 'Secure and compliant', icon: ShieldCheck, color: 'from-teal-400 to-emerald-600' },
  { title: 'Built for Growth', copy: 'Scale with your business', icon: TrendingUp, color: 'from-indigo-400 to-purple-700' },
]

function buildGoogleAuthUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) return ''
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin
  const state = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem('echoai_google_oauth_state', state)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'openid email profile',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

function EchoLogo({ dark = false, compact = false }) {
  const barBase = dark ? 'bg-gradient-to-b from-cyan-400 to-blue-500' : 'bg-gradient-to-b from-blue-400 to-indigo-600'
  const textColor = dark ? 'text-white' : 'text-[#08145f]'
  const aiGradient = dark
    ? 'from-cyan-400 via-blue-400 to-violet-400'
    : 'from-blue-600 via-indigo-600 to-violet-600'

  return (
    <div className={`flex items-center justify-center gap-2.5`}>
      <div className="flex items-end gap-[3px]" style={{ height: compact ? '28px' : '34px' }}>
        <span className={`w-1 rounded-full ${barBase}`} style={{ height: compact ? '10px' : '12px' }} />
        <span className={`w-1 rounded-full ${barBase}`} style={{ height: compact ? '18px' : '22px' }} />
        <span className={`w-1.5 rounded-full ${barBase}`} style={{ height: compact ? '26px' : '32px' }} />
        <span className={`w-1 rounded-full ${barBase}`} style={{ height: compact ? '18px' : '22px' }} />
        <span className={`w-1 rounded-full ${barBase}`} style={{ height: compact ? '10px' : '12px' }} />
      </div>
      <span className={`font-black tracking-tight ${textColor} ${compact ? 'text-2xl' : 'text-3xl'}`}>
        echo<span className={`bg-gradient-to-r ${aiGradient} bg-clip-text text-transparent`}>AI</span>
      </span>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section
      className="relative hidden min-h-0 flex-col overflow-hidden rounded-[2.25rem] lg:flex"
      style={{ background: 'linear-gradient(135deg, #060b1a 0%, #0d1535 35%, #0f1040 60%, #080c1f 100%)' }}
    >
      {/* ── Ambient Glow Orbs ── */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/15 blur-[90px]" />

      {/* ── Decorative grid overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Top-right dot cluster ── */}
      <div className="pointer-events-none absolute right-10 top-10 opacity-20">
        {[...Array(5)].map((_, r) => (
          <div key={r} className="flex gap-3 mb-3">
            {[...Array(6)].map((_, c) => (
              <div key={c} className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            ))}
          </div>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-between px-10 py-8">
        {/* ── HEADER ── */}
        <div className="text-center">
          <EchoLogo dark />

          {/* Pill badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold text-blue-300 tracking-wide">Medical-Grade AI · Echocardiography Intelligence</span>
          </div>

          <h1 className="mt-4 leading-none">
            <span className="block text-[2.4rem] font-black tracking-tight text-white xl:text-[2.8rem]">
              Your AI-Powered
            </span>
            <span
              className="block text-[2.4rem] font-black tracking-tight xl:text-[2.8rem]"
              style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              Data Intelligence Platform
            </span>
          </h1>
          <p className="mt-3 text-base font-medium text-slate-400 tracking-widest uppercase">
            Connect · Analyze · Act
          </p>
        </div>

        {/* ── PIPELINE CARDS ── */}
        <div className="relative my-auto grid grid-cols-6 gap-3.5 py-2">
          {pipelineSteps.map((step, index) => {
            const HeroIcon = step.icon
            const SubIcon = step.subIcon

            return (
              <div key={step.title} className="relative flex flex-col items-center group">
                <div
                  className={`relative w-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1.5 group-hover:bg-white/8 group-hover:border-white/20 group-hover:shadow-2xl ${step.border} text-center flex flex-col items-center group-hover:${step.glow}`}
                >
                  {/* Inner glow on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b ${step.iconBg} blur-2xl`} style={{ opacity: 0 }} />

                  {/* Step number */}
                  <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg mb-3 ${step.badge}`}>
                    {step.number}
                  </span>

                  {/* Large 3D Icon */}
                  <div className="relative z-10 mb-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.iconBg} shadow-xl ${step.glow}`}>
                      <HeroIcon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                    {/* Corner sub-badge */}
                    <div className={`absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-slate-900 shadow-lg ${step.subBg}`}>
                      <SubIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Text */}
                  <h3 className="relative z-10 text-sm font-bold text-white">{step.title}</h3>
                  <p className={`relative z-10 mt-1 text-[10.5px] font-medium leading-tight ${step.accentText} opacity-80`}>{step.copy}</p>
                </div>

                {/* Arrow connector */}
                {index < pipelineSteps.length - 1 && (
                  <div className="absolute -right-3 top-[46%] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/80 backdrop-blur-sm shadow-lg">
                    <ArrowRight className="h-3 w-3 text-slate-300" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM FEATURES + TRUST ── */}
        <div
          className="rounded-2xl border border-white/10 backdrop-blur-xl px-6 py-4"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div className="grid grid-cols-6 gap-4">
            {bottomFeatures.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <Icon className="h-4.5 w-4.5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-white leading-tight">{item.title}</h4>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400 leading-tight">{item.copy}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trust line */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-3.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
            </div>
            <p className="text-[11.5px] font-medium text-slate-400">
              Trusted by forward-thinking clinical teams to turn scan data into{' '}
              <span className="font-semibold text-cyan-400">real impact.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([scanService.getDashboardStats(), patientService.getPatients()])
  }, [])

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const state = hashParams.get('state')
    const expectedState = sessionStorage.getItem('echoai_google_oauth_state')
    if (!accessToken || (expectedState && state !== expectedState)) return
    localStorage.setItem('echoai_google_access_token', accessToken)
    sessionStorage.removeItem('echoai_google_oauth_state')
    window.history.replaceState({}, document.title, window.location.pathname)
    navigate('/dashboard', { replace: true })
  }, [navigate])

  const useDemoUser = (user = demoUsers[0]) => {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const login = email.trim().toLowerCase()
    const matchedUser = demoUsers.find(
      (u) => (u.email.toLowerCase() === login || u.userName.toLowerCase() === login) && u.password === password,
    )
    if (!matchedUser) {
      setError('Incorrect credentials. Use the founder login below.')
      return
    }
    const storage = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    other.removeItem('echoai_user')
    storage.setItem('echoai_user', JSON.stringify({ name: matchedUser.name, role: matchedUser.role, email: matchedUser.email }))
    navigate('/dashboard', { replace: true })
  }

  const handleGoogleSignIn = () => {
    const authUrl = buildGoogleAuthUrl()
    window.location.assign(authUrl || 'https://accounts.google.com/signin/v2/identifier')
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0a0f1e] p-3 text-slate-900 sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <PlatformTemplate />

        {/* ── RIGHT LOGIN PANEL ── */}
        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[2.25rem] border border-slate-200 bg-white px-7 py-6 text-[#08145f] shadow-2xl shadow-black/30">
          <EchoLogo compact />

          <div className="mt-5 text-center">
            <h2 className="text-2xl font-black text-[#08145f]">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Access scan reports and AI insights.</p>
          </div>

          {/* Quick demo login */}
          <button
            type="button"
            onClick={() => useDemoUser()}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 hover:opacity-95 active:scale-[0.98]"
          >
            <ArrowRight className="h-4 w-4" />
            Use Dr Shanthi Account
          </button>

          <form className="mt-4 space-y-3" onSubmit={handleLogin}>
            <label className="block">
              <span className="text-sm font-semibold text-[#08145f]">Email Address</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                <Mail className="h-4 w-4 shrink-0" />
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
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-400 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                <Lock className="h-4 w-4 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded p-1 hover:bg-slate-100 text-slate-400 transition" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                Remember me
              </label>
              <button type="button" onClick={() => setError('Use the founder credentials below.')} className="font-semibold text-indigo-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 text-sm font-semibold text-indigo-700 transition hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-300"
            >
              <Zap className="h-4 w-4" />
              Login
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:shadow-md"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Founder login card */}
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">Founder Access</p>
            </div>
            <button
              type="button"
              onClick={() => useDemoUser()}
              className="w-full rounded-xl border border-indigo-100 bg-white px-3.5 py-3 text-left shadow-xs transition hover:border-indigo-300 hover:shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">DS</span>
                <span>
                  <span className="block text-sm font-bold text-[#08145f]">Dr Shanthi · Founder</span>
                  <span className="block text-[11px] text-slate-500">dr.shanthi@echoai.com</span>
                </span>
              </span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
