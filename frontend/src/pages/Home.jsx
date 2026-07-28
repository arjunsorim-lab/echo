import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image,
  Lock,
  Mail,
  Monitor,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
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
    number: '01',
    title: 'Connect Device',
    copy: 'Securely connect & collect scan data from echo workstations.',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    hero: Monitor,
    footer: 'DICOM · HL7 · FHIR · APIs',
    items: [
      { label: 'Echo workstation', icon: Monitor },
      { label: 'Live scan stream', icon: Activity },
    ],
  },
  {
    number: '02',
    title: 'Ingest Scan Data',
    copy: 'Capture raw DICOM data, images, metadata and patient context.',
    gradient: 'from-cyan-600 via-teal-600 to-emerald-500',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    hero: Database,
    footer: 'Encrypted & Secure Pipeline',
    items: [
      { label: 'Raw Data', icon: Database },
      { label: 'Images', icon: Image },
      { label: 'Metadata', icon: FileText },
      { label: 'Patient Context', icon: User },
    ],
  },
  {
    number: '03',
    title: 'AI/ML Analysis',
    copy: 'Analyze scan loops to detect cardiac patterns and risk scores.',
    gradient: 'from-purple-600 via-violet-600 to-indigo-500',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    hero: BrainCircuit,
    footer: 'ML Models & Advanced Analytics',
    items: [
      { label: 'Pattern Recognition', icon: CheckCircle2 },
      { label: 'Anomaly Detection', icon: CheckCircle2 },
      { label: 'Risk Scoring', icon: CheckCircle2 },
      { label: 'Trend Analysis', icon: CheckCircle2 },
    ],
  },
  {
    number: '04',
    title: 'LLM Reporting',
    copy: 'Generate natural language summaries & proactive clinical alerts.',
    gradient: 'from-indigo-600 via-blue-600 to-sky-500',
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    hero: FileText,
    footer: 'LLM + Medical Domain Knowledge',
    items: [
      { label: 'Natural Language Summaries', icon: FileText },
      { label: 'Clinical Insights', icon: Sparkles },
      { label: 'Recommendations', icon: BarChart3 },
      { label: 'Proactive Alerts', icon: Bell },
    ],
  },
  {
    number: '05',
    title: 'Actionable Insights',
    copy: 'Deliver proactive insights to drive better patient care decisions.',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    hero: TrendingUp,
    footer: 'EHR, PACS & Export Integrations',
    items: [
      { label: 'Detailed Reports', icon: FileText },
      { label: 'Trend Dashboard', icon: TrendingUp },
      { label: 'Alerts & Notifications', icon: Bell },
      { label: 'Share & Collaborate', icon: Users },
      { label: 'EHR, PACS, integrations', icon: Download },
    ],
  },
]

const benefitItems = [
  { title: 'Secure & Compliant', copy: 'Encrypted and audit-ready.', icon: ShieldCheck, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { title: 'Save Time', copy: 'Automate reporting in minutes.', icon: Clock, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { title: 'Improve Accuracy', copy: 'Reduce manual reporting errors.', icon: Target, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { title: 'Proactive Care', copy: 'Identify risks earlier.', icon: BarChart3, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { title: 'Better Collaboration', copy: 'Share insights across teams.', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
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
        <div className="absolute inset-0 rounded-full border-[4px] border-cyan-400 border-r-indigo-500 animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-[3.5px] border-indigo-500 border-l-cyan-300" />
        <div className="absolute inset-[0.95rem] rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 shadow-md shadow-cyan-500/50" />
      </div>
      <div className={`font-black tracking-tight text-white ${compact ? 'text-3xl' : 'text-4xl'}`}>
        echo<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">AI</span>
      </div>
    </div>
  )
}

function PlatformTemplate() {
  return (
    <section className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#0b132b] p-6 shadow-2xl backdrop-blur-2xl lg:flex">
      {/* Background Glowing Ambient Orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-600/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 -bottom-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      {/* Header */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 shadow-inner mb-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Next-Gen AI Echocardiography Intelligence Platform</span>
        </div>
        <EchoLogo />
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white drop-shadow-md xl:text-3xl">
          From Scan Data to Proactive Insights
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-300 max-w-2xl mx-auto">
          Leverage AI/ML models & LLMs to instantly transform raw device scan data into clinical-grade actionable reports.
        </p>
      </div>

      {/* 5-Step Process Pipeline Cards (Rich Full Height Content) */}
      <div className="relative grid min-h-0 flex-1 grid-cols-5 gap-3.5 my-4">
        {pipelineSteps.map((step, index) => {
          const HeroIcon = step.hero

          return (
            <div
              key={step.title}
              className="group relative flex min-h-0 flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/95 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              {/* Arrow Connector */}
              {index < pipelineSteps.length - 1 && (
                <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900 text-cyan-400 shadow-md">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}

              {/* Card Header Banner */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-md bg-gradient-to-br ${step.gradient}`}>
                    {step.number}
                  </span>
                  <h2 className="min-w-0 flex-1 text-xs font-bold leading-tight text-white group-hover:text-cyan-300 transition">
                    {step.title}
                  </h2>
                  <div className={`p-1.5 rounded-lg border ${step.iconBg}`}>
                    <HeroIcon className="h-4 w-4 shrink-0" />
                  </div>
                </div>

                <p className="mt-2.5 text-[11px] font-medium leading-relaxed text-slate-300">
                  {step.copy}
                </p>

                {/* Sub-Items Badges */}
                <div className="mt-3 space-y-1.5">
                  {step.items.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 shadow-inner group-hover:border-slate-700 transition"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Pill */}
              <div className="mt-3 flex items-center justify-center rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900 px-2.5 py-2 text-center text-[10px] font-bold text-cyan-300">
                {step.footer}
              </div>
            </div>
          )
        })}
      </div>

      {/* Why echoAI? Feature Section */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-800" />
          <h2 className="text-xs font-bold tracking-wider text-cyan-300 uppercase">Why echoAI?</h2>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          {benefitItems.map(({ title, copy, icon: Icon, color }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5">
              <div className={`p-2 rounded-xl border ${color} shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[11px] font-bold text-white truncate">{title}</h3>
                <p className="text-[10px] font-medium leading-tight text-slate-400 truncate">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
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
    <main className="h-screen overflow-hidden bg-slate-950 p-3 text-white sm:p-4">
      <div className="mx-auto grid h-full max-w-[1880px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_430px]">
        <PlatformTemplate />

        <aside className="flex min-h-0 flex-col justify-center overflow-y-auto rounded-[1.75rem] border border-blue-100 bg-white px-7 py-5 text-[#07135d] shadow-2xl shadow-cyan-950/50">
          <EchoLogo compact />
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-[#07135d]">Welcome Back</h2>
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
              <span className="text-sm font-semibold text-[#07135d]">Email Address</span>
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
              <span className="text-sm font-semibold text-[#07135d]">Password</span>
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
