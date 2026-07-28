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

// 6-step pipeline matching mockup exactly
const pipelineSteps = [
  {
    number: '1',
    title: 'Connect',
    copy: 'Securely connect your data in seconds',
    badgeBg: 'bg-blue-500',
    icon: Database,
    subIcon: Link2,
    // Blue + indigo gradient icon
    iconStyle: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-blue-300/60',
    subIconStyle: 'bg-emerald-500 ring-white',
  },
  {
    number: '2',
    title: 'Ingest',
    copy: 'Capture and unify your data',
    badgeBg: 'bg-emerald-500',
    icon: Upload,
    subIcon: Upload,
    iconStyle: 'bg-gradient-to-br from-emerald-400 via-teal-400 to-green-500',
    iconShadow: 'shadow-emerald-300/60',
    subIconStyle: 'bg-emerald-500 ring-white',
  },
  {
    number: '3',
    title: 'Analyze',
    copy: 'Detect patterns and key insights',
    badgeBg: 'bg-purple-600',
    icon: Search,
    subIcon: BarChart3,
    iconStyle: 'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600',
    iconShadow: 'shadow-purple-300/60',
    subIconStyle: 'bg-purple-500 ring-white',
  },
  {
    number: '4',
    title: 'Report',
    copy: 'Generate reports instantly',
    badgeBg: 'bg-blue-500',
    icon: FileText,
    subIcon: FileText,
    iconStyle: 'bg-gradient-to-br from-blue-300 via-sky-400 to-blue-500',
    iconShadow: 'shadow-blue-200/60',
    subIconStyle: 'bg-blue-500 ring-white',
  },
  {
    number: '5',
    title: 'Act',
    copy: 'Take action with confidence',
    badgeBg: 'bg-teal-500',
    icon: Rocket,
    subIcon: Rocket,
    iconStyle: 'bg-gradient-to-br from-teal-400 via-emerald-400 to-green-500',
    iconShadow: 'shadow-teal-300/60',
    subIconStyle: 'bg-teal-500 ring-white',
  },
  {
    number: '6',
    title: 'Impact',
    copy: 'Drive better outcomes together',
    badgeBg: 'bg-indigo-500',
    icon: Users,
    subIcon: Sparkles,
    iconStyle: 'bg-gradient-to-br from-indigo-300 via-violet-400 to-purple-500',
    iconShadow: 'shadow-indigo-200/60',
    subIconStyle: 'bg-yellow-500 ring-white',
  },
]

// 6 bottom feature items matching mockup
const bottomFeatures = [
  { title: 'All Your Data', copy: 'Connect any source seamlessly', icon: Link2, iconStyle: 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white' },
  { title: 'Any Format', copy: 'Ingest structured and unstructured data', icon: Upload, iconStyle: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' },
  { title: 'AI-Powered Insights', copy: 'Smarter analysis, deeper insights', icon: BarChart3, iconStyle: 'bg-gradient-to-br from-purple-400 to-violet-500 text-white' },
  { title: 'Clear & Actionable', copy: 'Reports that drive real decisions', icon: FileText, iconStyle: 'bg-gradient-to-br from-blue-400 to-sky-500 text-white' },
  { title: 'Enterprise Ready', copy: 'Secure, reliable and compliant', icon: ShieldCheck, iconStyle: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' },
  { title: 'Built for Growth', copy: 'Scale with your business', icon: TrendingUp, iconStyle: 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white' },
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

/* Soundwave bars logo matching mockup exactly */
function EchoLogo({ compact = false }) {
  const barClass = 'rounded-full bg-gradient-to-b from-blue-400 to-indigo-600 w-1'
  return (
    <div className={`flex items-center justify-center gap-2.5 ${compact ? '' : ''}`}>
      {/* Signal bars */}
      <div className="flex items-end gap-[3px]" style={{ height: compact ? '28px' : '34px' }}>
        <span className={`${barClass}`} style={{ height: compact ? '10px' : '12px' }} />
        <span className={`${barClass}`} style={{ height: compact ? '18px' : '22px' }} />
        <span className={`${barClass} w-1.5`} style={{ height: compact ? '26px' : '32px' }} />
        <span className={`${barClass}`} style={{ height: compact ? '18px' : '22px' }} />
        <span className={`${barClass}`} style={{ height: compact ? '10px' : '12px' }} />
      </div>
      <span className={`font-black tracking-tight text-[#08145f] ${compact ? 'text-2xl' : 'text-3xl'}`}>
        echo<span className="text-[#08145f]">AI</span>
      </span>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section className="relative hidden min-h-0 flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 lg:flex"
      style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 40%, #f5f0ff 70%, #faf8ff 100%)' }}>

      {/* Decorative dot grid top right */}
      <div className="pointer-events-none absolute right-8 top-8 opacity-30">
        {[...Array(4)].map((_, row) => (
          <div key={row} className="flex gap-2.5 mb-2.5">
            {[...Array(5)].map((_, col) => (
              <div key={col} className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            ))}
          </div>
        ))}
      </div>
      {/* Decorative dot grid bottom left */}
      <div className="pointer-events-none absolute bottom-8 left-8 opacity-20">
        {[...Array(3)].map((_, row) => (
          <div key={row} className="flex gap-2.5 mb-2.5">
            {[...Array(4)].map((_, col) => (
              <div key={col} className="h-1.5 w-1.5 rounded-full bg-purple-300" />
            ))}
          </div>
        ))}
      </div>
      {/* Soft corner blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-purple-100/50 blur-3xl" />

      <div className="relative flex min-h-0 flex-1 flex-col justify-between px-10 py-8">
        {/* ── HEADER ── */}
        <div className="text-center">
          <EchoLogo />
          <h1 className="mt-4 leading-tight">
            <span className="block text-3xl font-black text-[#08145f] xl:text-4xl">Your AI-Powered</span>
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-3xl font-black text-transparent xl:text-4xl">
              Data Intelligence Platform
            </span>
          </h1>
          <p className="mt-3 text-base font-medium text-slate-500 tracking-wide">
            Connect. Analyze. Act.
          </p>
        </div>

        {/* ── PIPELINE CARDS ── */}
        <div className="relative grid grid-cols-6 gap-4 my-auto py-4">
          {pipelineSteps.map((step, index) => {
            const HeroIcon = step.icon
            const SubIcon = step.subIcon

            return (
              <div key={step.title} className="relative flex flex-col items-center group">
                {/* Card */}
                <div className="relative w-full rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-300/50 text-center flex flex-col items-center">
                  {/* Step Number Badge */}
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${step.badgeBg} mb-4`}>
                    {step.number}
                  </span>

                  {/* Large 3D-style Icon */}
                  <div className="relative mb-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${step.iconShadow} ${step.iconStyle}`}>
                      <HeroIcon className="h-9 w-9 text-white" strokeWidth={1.5} />
                    </div>
                    {/* Sub icon badge bottom-right */}
                    <div className={`absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white shadow-md ${step.subIconStyle}`}>
                      <SubIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#08145f]">{step.title}</h3>
                  {/* Copy */}
                  <p className="mt-1 text-[11px] font-medium leading-tight text-slate-500">{step.copy}</p>
                </div>

                {/* Arrow between cards */}
                {index < pipelineSteps.length - 1 && (
                  <div className="absolute -right-3 top-[44%] z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM FEATURE ROW ── */}
        <div className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm px-4 py-4 shadow-sm">
          <div className="grid grid-cols-6 gap-3">
            {bottomFeatures.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md ${item.iconStyle}`}>
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-[#08145f] leading-tight">{item.title}</h4>
                    <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">{item.copy}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trust badge */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-3">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <p className="text-[11px] font-medium text-slate-500">
              Trusted by forward-thinking teams to turn data into{' '}
              <span className="font-semibold text-blue-600">real impact.</span>
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
    storage.setItem('echoai_user', JSON.stringify({ name: matchedUser.name, role: matchedUser.role, email: matchedUser.email }))
    navigate('/dashboard', { replace: true })
  }

  const handleGoogleSignIn = () => {
    const authUrl = buildGoogleAuthUrl()
    window.location.assign(authUrl || 'https://accounts.google.com/signin/v2/identifier')
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-3 text-slate-900 sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <PlatformTemplate />

        {/* ── LOGIN PANEL ── */}
        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[2rem] border border-slate-200 bg-white px-7 py-6 text-[#08145f] shadow-xl shadow-slate-200/60">
          <EchoLogo compact />
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-[#08145f]">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Access scan reports and AI insights.</p>
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
              <span className="text-sm font-semibold text-[#08145f]">Email Address</span>
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4.5 w-4.5 shrink-0" />
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
              <span className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 text-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-4.5 w-4.5 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#08145f] outline-none placeholder:text-slate-400"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded p-1 hover:bg-slate-100" aria-label="Toggle password">
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Remember me
              </label>
              <button type="button" onClick={() => setError('Use the founder credentials below.')} className="font-semibold text-blue-600 hover:underline">
                Forgot Password?
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>
            )}

            <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <Zap className="h-4 w-4" />
              Login
            </button>
          </form>

          <div className="my-3 flex items-center gap-4 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <span className="text-base font-bold text-blue-600">G</span>
            Sign in with Google
          </button>

          <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Founder login</p>
            </div>
            <button
              type="button"
              onClick={() => useDemoUser()}
              className="mt-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-left shadow-xs transition hover:border-blue-300 hover:shadow-sm"
            >
              <span className="block text-sm font-bold text-[#08145f]">Dr Shanthi · Founder</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">dr.shanthi@echoai.com / password123</span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Home
