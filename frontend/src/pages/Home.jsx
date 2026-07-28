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
    name: 'Dr Shanti',
    role: 'Owner',
    email: 'dr.shanti@echoai.com',
    userName: 'dr.shanti',
    password: 'password123',
  },
]

const pipelineSteps = [
  {
    title: 'Connect',
    copy: 'Securely connect your data in seconds',
    icon: Database,
    tone: 'blue',
  },
  {
    title: 'Ingest',
    copy: 'Capture and unify your data',
    icon: Upload,
    tone: 'emerald',
  },
  {
    title: 'Analyze',
    copy: 'Detect patterns and key insights',
    icon: BarChart3,
    tone: 'violet',
  },
  {
    title: 'Report',
    copy: 'Generate reports instantly',
    icon: FileText,
    tone: 'blue',
  },
  {
    title: 'Act',
    copy: 'Take action with confidence',
    icon: Rocket,
    tone: 'emerald',
  },
  {
    title: 'Impact',
    copy: 'Drive better outcomes together',
    icon: Users,
    tone: 'violet',
  },
]

const outcomes = [
  { title: 'Connect', copy: 'All Your Data', icon: Link2, tone: 'blue' },
  { title: 'Ingest', copy: 'Any Format', icon: Upload, tone: 'emerald' },
  { title: 'Analyze', copy: 'AI-Powered Insights', icon: BarChart3, tone: 'violet' },
  { title: 'Report', copy: 'Clear & Actionable', icon: FileText, tone: 'blue' },
  { title: 'Act', copy: 'Drive Impact', icon: Rocket, tone: 'emerald' },
  { title: 'Secure', copy: 'Enterprise Ready', icon: ShieldCheck, tone: 'emerald' },
  { title: 'Scale', copy: 'Built for Growth', icon: TrendingUp, tone: 'violet' },
]

const toneClasses = {
  blue: {
    badge: 'bg-blue-500',
    icon: 'text-blue-600',
    iconBackground: 'from-blue-50 to-blue-100/80',
  },
  emerald: {
    badge: 'bg-emerald-500',
    icon: 'text-emerald-500',
    iconBackground: 'from-emerald-50 to-cyan-50',
  },
  violet: {
    badge: 'bg-violet-500',
    icon: 'text-violet-600',
    iconBackground: 'from-violet-50 to-indigo-50',
  },
}

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
    <div className="flex items-center justify-center gap-3">
      <div className={`relative shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
        <div className="absolute inset-0 rounded-full border-[4px] border-blue-400 border-r-violet-500" />
        <div className="absolute inset-2 rounded-full border-[3.5px] border-indigo-500 border-l-cyan-400" />
        <div className="absolute inset-[0.95rem] rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-sm" />
      </div>
      <div className={`font-black tracking-tight text-[#08145f] ${compact ? 'text-3xl' : 'text-4xl'}`}>
        echo<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">AI</span>
      </div>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section className="relative hidden min-h-0 overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-[#f8fbff] to-[#f1f6ff] p-5 shadow-sm lg:flex lg:flex-col">
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-blue-100/40 blur-sm" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-indigo-100/50" />
      <div className="pointer-events-none absolute bottom-10 right-8 h-36 w-36 rounded-full bg-blue-100/30 blur-2xl" />

      <div className="relative text-center">
        <EchoLogo compact />
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#08145f] xl:text-3xl">
          Your AI-Powered Data Intelligence Platform
        </h1>
        <p className="mt-1 text-sm font-bold text-blue-600">Connect. Analyze. Act.</p>
      </div>

      <div className="relative mt-5 grid min-h-0 flex-1 grid-cols-6 gap-3">
        {pipelineSteps.map((step, index) => {
          const Icon = step.icon
          const tone = toneClasses[step.tone]

          return (
            <article key={step.title} className="relative flex min-w-0 flex-col items-center text-center">
              {index < pipelineSteps.length - 1 && (
                <div className="absolute left-[67%] top-[9.6rem] z-10 hidden w-[72%] border-t-2 border-dotted border-blue-400 xl:block">
                  <ArrowRight className="absolute -right-2 -top-2.5 h-4 w-4 text-blue-500" />
                </div>
              )}
              <div className="flex min-h-[54px] items-start justify-center gap-1.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${tone.badge}`}>
                  {index + 1}
                </span>
                <div className="text-left">
                  <h2 className="text-xs font-bold text-[#08145f]">{step.title}</h2>
                  <p className="mt-1 text-[10px] leading-tight text-slate-600">{step.copy}</p>
                </div>
              </div>
              <div className={`mt-3 flex h-28 w-full max-w-[124px] items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br ${tone.iconBackground} shadow-lg shadow-blue-100/60`}>
                <Icon className={`h-14 w-14 ${tone.icon}`} strokeWidth={1.8} />
              </div>
            </article>
          )
        })}
      </div>

      <div className="relative mt-4 grid grid-cols-7 gap-3">
        {outcomes.map((item) => {
          const Icon = item.icon
          const tone = toneClasses[item.tone]
          return (
            <article key={item.title} className="flex min-h-[104px] flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white px-2 py-3 text-center shadow-lg shadow-blue-100/50">
              <Icon className={`h-8 w-8 ${tone.icon}`} />
              <h3 className="mt-2 text-xs font-bold text-[#08145f]">{item.title}</h3>
              <p className="mt-0.5 text-[10px] text-slate-600">{item.copy}</p>
            </article>
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
    const matchedUser = demoUsers.find((user) => (
      (user.email.toLowerCase() === login || user.userName.toLowerCase() === login) &&
      user.password === password
    ))

    if (!matchedUser) {
      setError('Email or password is incorrect. Use the Dr Shanti owner credentials below.')
      return
    }

    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage
    otherStorage.removeItem('echoai_user')
    storage.setItem('echoai_user', JSON.stringify({
      name: matchedUser.name,
      role: matchedUser.role,
      email: matchedUser.email,
    }))
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
            Use Dr Shanti Account
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
              <button type="button" onClick={() => setError('Use the owner credentials shown below.')} className="font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <Zap className="h-4 w-4" />
              Login
            </button>
          </form>

          <div className="my-4 flex items-center gap-4 text-xs text-slate-500">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <span className="text-lg font-bold text-blue-600">G</span>
            Sign in with Google
          </button>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Owner login</p>
            </div>
            <button type="button" onClick={() => useDemoUser()} className="mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-left hover:border-blue-300">
              <span className="block text-sm font-bold text-[#07135d]">Dr Shanti · Owner</span>
              <span className="mt-1 block text-xs text-slate-600">dr.shanti@echoai.com / password123</span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
