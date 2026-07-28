import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  FileText,
  LineChart,
  Link2,
  Lock,
  Mail,
  PieChart,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
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
    copy: 'Securely connect your data in seconds',
    badgeBg: 'bg-blue-600',
    cardGradient: 'from-[#e4f0ff] via-[#d6e7ff] to-[#c5deff] border-blue-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-600 text-white shadow-md shadow-blue-500/30',
    icon: Database,
  },
  {
    number: '2',
    title: 'Ingest',
    copy: 'Capture and unify your data',
    badgeBg: 'bg-emerald-500',
    cardGradient: 'from-[#e3f9ed] via-[#d2f5e3] to-[#bbf0d6] border-emerald-200',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
    icon: Upload,
  },
  {
    number: '3',
    title: 'Analyze',
    copy: 'Detect patterns and key insights',
    badgeBg: 'bg-purple-600',
    cardGradient: 'from-[#f3e6ff] via-[#e8d2ff] to-[#dac0ff] border-purple-200',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-600 text-white shadow-md shadow-purple-500/30',
    icon: Search,
  },
  {
    number: '4',
    title: 'Report',
    copy: 'Generate reports instantly',
    badgeBg: 'bg-blue-500',
    cardGradient: 'from-[#e4f0ff] via-[#d6e7ff] to-[#c5deff] border-blue-200',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500 text-white shadow-md shadow-blue-500/30',
    icon: PieChart,
  },
  {
    number: '5',
    title: 'Act',
    copy: 'Take action with confidence',
    badgeBg: 'bg-emerald-500',
    cardGradient: 'from-[#e3f9ed] via-[#d2f5e3] to-[#bbf0d6] border-emerald-200',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
    icon: Rocket,
  },
  {
    number: '6',
    title: 'Impact',
    copy: 'Drive better outcomes together',
    badgeBg: 'bg-purple-600',
    cardGradient: 'from-[#f3e6ff] via-[#e8d2ff] to-[#dac0ff] border-purple-200',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-600 text-white shadow-md shadow-purple-500/30',
    icon: Users,
  },
]

const outcomes = [
  { title: 'Connect', copy: 'All Your Data', icon: Link2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { title: 'Ingest', copy: 'Any Format', icon: Upload, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { title: 'Analyze', copy: 'AI-Powered Insights', icon: LineChart, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { title: 'Report', copy: 'Clear & Actionable', icon: FileText, color: 'text-blue-500 bg-blue-50 border-blue-100' },
  { title: 'Act', copy: 'Drive Impact', icon: Rocket, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { title: 'Secure', copy: 'Enterprise Ready', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50 border-teal-100' },
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
    <div className="flex items-center justify-center gap-2.5">
      {/* Soundwave Signal Bar Icon Matching Mockup */}
      <div className="flex items-center gap-1 text-blue-600">
        <span className="h-4 w-1 rounded-full bg-blue-500" />
        <span className="h-6 w-1 rounded-full bg-blue-600" />
        <span className="h-8 w-1 rounded-full bg-blue-700" />
        <span className="h-5 w-1 rounded-full bg-blue-500" />
      </div>
      <div className={`font-black tracking-tight text-[#08145f] ${compact ? 'text-3xl' : 'text-4xl'}`}>
        echo<span className="text-blue-600">AI</span>
      </div>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white/90 p-7 shadow-xl shadow-blue-500/5 backdrop-blur-md lg:flex">
      {/* Background Soft Wave Graphic Elements */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-teal-100/30 blur-3xl" />

      {/* Header Matching Mockup */}
      <div className="relative text-center">
        <EchoLogo />
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08145f] xl:text-3xl">
          Your AI-Powered Data Intelligence Platform
        </h1>
        <p className="mt-1.5 text-sm font-bold text-blue-600 tracking-wide">Connect. Analyze. Act.</p>
      </div>

      {/* 6-Step Horizontal Pipeline Flow Matching Mockup */}
      <div className="relative my-auto space-y-8">
        <div className="grid grid-cols-6 gap-4">
          {pipelineSteps.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.title} className="group relative flex flex-col items-center text-center">
                {/* Header Step Pill */}
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ${step.badgeBg}`}>
                    {step.number}
                  </span>
                  <span className="text-xs font-bold text-[#08145f]">{step.title}</span>
                </div>

                <p className="mb-4 text-[11px] font-medium leading-tight text-slate-500 h-8 max-w-[130px]">
                  {step.copy}
                </p>

                {/* 3D Glass Soft Rounded Card */}
                <div className={`relative flex aspect-square w-full max-w-[136px] items-center justify-center rounded-3xl border bg-gradient-to-b ${step.cardGradient} p-4 shadow-lg shadow-blue-500/10 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl`}>
                  {/* Inner Icon Box */}
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg}`}>
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Dotted Arrow Connector */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 text-blue-400">
                      <span className="text-xs font-bold">┄┄►</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Central Connected Waveform Orb Node */}
        <div className="relative flex items-center justify-center pt-2">
          <div className="absolute inset-x-12 h-0.5 border-b-2 border-dashed border-blue-200" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-white">
            <div className="flex items-center gap-0.5">
              <span className="h-3 w-0.5 rounded-full bg-white animate-pulse" />
              <span className="h-5 w-0.5 rounded-full bg-white" />
              <span className="h-4 w-0.5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 7 Feature Cards at Bottom Matching Mockup */}
      <div className="relative grid grid-cols-7 gap-3">
        {outcomes.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-3.5 text-center shadow-md shadow-blue-500/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-200"
            >
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-[#08145f]">{item.title}</h3>
              <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">{item.copy}</p>
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
