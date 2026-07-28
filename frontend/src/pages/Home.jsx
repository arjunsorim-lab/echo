import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  EyeOff,
  FileText,
  LineChart,
  Link2,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
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
    copy: 'Securely connect scan data in seconds',
    icon: Database,
    badgeBg: 'bg-blue-600',
    cardGradient: 'from-blue-50/90 to-indigo-50/40 border-blue-100',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-500/10 border-blue-200',
  },
  {
    number: '2',
    title: 'Ingest',
    copy: 'Capture and unify raw DICOM images',
    icon: Upload,
    badgeBg: 'bg-emerald-600',
    cardGradient: 'from-emerald-50/90 to-teal-50/40 border-emerald-100',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10 border-emerald-200',
  },
  {
    number: '3',
    title: 'Analyze',
    copy: 'Detect cardiac patterns and key insights',
    icon: BarChart3,
    badgeBg: 'bg-purple-600',
    cardGradient: 'from-purple-50/90 to-violet-50/40 border-purple-100',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-500/10 border-purple-200',
  },
  {
    number: '4',
    title: 'Report',
    copy: 'Generate structured reports instantly',
    icon: FileText,
    badgeBg: 'bg-blue-500',
    cardGradient: 'from-blue-50/90 to-sky-50/40 border-blue-100',
    iconColor: 'text-blue-500',
    iconBg: 'bg-sky-500/10 border-sky-200',
  },
  {
    number: '5',
    title: 'Act',
    copy: 'Take action with clinical confidence',
    icon: Rocket,
    badgeBg: 'bg-teal-600',
    cardGradient: 'from-teal-50/90 to-emerald-50/40 border-teal-100',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-500/10 border-teal-200',
  },
  {
    number: '6',
    title: 'Impact',
    copy: 'Drive better patient outcomes together',
    icon: Users,
    badgeBg: 'bg-indigo-600',
    cardGradient: 'from-indigo-50/90 to-purple-50/40 border-indigo-100',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-500/10 border-indigo-200',
  },
]

const outcomes = [
  { title: 'Connect', copy: 'All Your Data', icon: Link2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { title: 'Ingest', copy: 'Any Format', icon: Upload, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { title: 'Analyze', copy: 'AI-Powered Insights', icon: LineChart, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { title: 'Report', copy: 'Clear & Actionable', icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  { title: 'Act', copy: 'Drive Impact', icon: Rocket, color: 'text-teal-600 bg-teal-50 border-teal-100' },
  { title: 'Secure', copy: 'Enterprise Ready', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { title: 'Scale', copy: 'Built for Growth', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
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

function EchoLogo({ compact = false }) {
  return (
    <div className="flex items-center justify-center gap-3.5">
      <div className={`relative shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
        <div className="absolute inset-0 rounded-full border-[4px] border-blue-400 border-r-violet-500" />
        <div className="absolute inset-2 rounded-full border-[3.5px] border-indigo-500 border-l-cyan-400" />
        <div className="absolute inset-[0.95rem] rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-xs" />
      </div>
      <div className={`font-black tracking-tight text-[#08145f] ${compact ? 'text-3xl' : 'text-4xl'}`}>
        echo<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">AI</span>
      </div>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-6 shadow-sm backdrop-blur-md lg:flex">
      {/* Background Soft Glow Accents */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-100/50 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-100/50 blur-2xl" />

      {/* Header */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs mb-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>AI-Powered Echo Reporting & Diagnostic Intelligence</span>
        </div>
        <EchoLogo />
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#08145f] xl:text-3xl">
          Your AI-Powered Data Intelligence Platform
        </h1>
        <p className="mt-1 text-xs font-bold tracking-wide text-blue-600">Connect. Analyze. Act.</p>
      </div>

      {/* 6-Step Modern Process Pipeline */}
      <div className="relative my-auto space-y-6">
        <div className="grid grid-cols-6 gap-3">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className="group relative flex flex-col items-center text-center">
                {/* Step Badge */}
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold shadow-2xs ${step.badgeBg} text-white`}>
                    {step.number}
                  </span>
                  <span className="text-xs font-bold text-[#08145f]">{step.title}</span>
                </div>

                <p className="mb-3 text-[11px] font-medium leading-tight text-slate-500 h-8 max-w-[130px]">
                  {step.copy}
                </p>

                {/* 3D Modern Glass Card */}
                <div className={`relative flex aspect-square w-full max-w-[140px] items-center justify-center rounded-2xl border bg-gradient-to-b ${step.cardGradient} p-4 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-md`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-xs ${step.iconBg}`}>
                    <Icon className={`h-7 w-7 ${step.iconColor}`} />
                  </div>

                  {/* Arrow Connector */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-blue-400">
                      <span className="text-xs font-bold">→</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Central Pulse Line */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-x-8 h-0.5 border-b-2 border-dashed border-blue-200" />
          <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 7 Modern Feature Outcome Cards */}
      <div className="relative grid grid-cols-7 gap-2.5">
        {outcomes.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/90 p-3 text-center shadow-2xs transition hover:border-blue-200 hover:bg-white hover:shadow-xs"
            >
              <div className={`mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl border ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-[#08145f]">{item.title}</h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500 leading-tight">{item.copy}</p>
            </div>
          )
        })}
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
      (user) =>
        (user.email.toLowerCase() === login || user.userName.toLowerCase() === login) &&
        user.password === password,
    )

    if (!matchedUser) {
      setError('Email or password is incorrect. Use the Dr Shanthi founder credentials below.')
      return
    }

    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage
    otherStorage.removeItem('echoai_user')
    storage.setItem(
      'echoai_user',
      JSON.stringify({
        name: matchedUser.name,
        role: matchedUser.role,
        email: matchedUser.email,
      }),
    )
    navigate('/dashboard', { replace: true })
  }

  const handleGoogleSignIn = () => {
    const authUrl = buildGoogleAuthUrl()
    window.location.assign(authUrl || 'https://accounts.google.com/signin/v2/identifier')
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-50 p-3 text-slate-900 sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_430px]">
        <PlatformTemplate />

        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white px-7 py-5 text-[#07135d] shadow-xl shadow-slate-200/60">
          <EchoLogo compact />
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-600">Access scan reports and AI insights.</p>
          </div>

          <button
            type="button"
            onClick={() => useDemoUser()}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:from-blue-700 hover:to-violet-700"
          >
            <ArrowRight className="h-4 w-4" />
            Use Dr Shanthi Account
          </button>

          <form className="mt-4 space-y-3" onSubmit={handleLogin}>
            <label className="block">
              <span className="text-sm font-semibold">Email Address</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-5 w-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError('')
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#07135d] outline-none"
                  placeholder="Email address or username"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Password</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-500 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#07135d] outline-none"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-md p-1 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setError('Use the founder credentials below.')}
                className="font-semibold text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Zap className="h-4 w-4" />
              Login
            </button>
          </form>

          <div className="my-4 flex items-center gap-4 text-xs text-slate-500">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="text-lg font-bold text-blue-600">G</span>
            Sign in with Google
          </button>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Founder login</p>
            </div>
            <button
              type="button"
              onClick={() => useDemoUser()}
              className="mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-left hover:border-blue-300"
            >
              <span className="block text-sm font-bold text-[#07135d]">Dr Shanthi · Founder</span>
              <span className="mt-1 block text-xs text-slate-600">dr.shanthi@echoai.com / password123</span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
