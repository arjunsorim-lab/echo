import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'
import showcaseImage from '../assets/echoai_showcase.png'

const demoUsers = [
  {
    name: 'Dr Shanthi',
    role: 'Founder',
    email: 'dr.shanthi@echoai.com',
    userName: 'dr.shanthi',
    password: 'password123',
  },
]

/*
--- PREVIOUS PLATFORM SHOWCASE CODE (COMMENTED AS REQUESTED) ---

const pipelineSteps = [
  { number: '1', title: 'Connect', copy: 'Securely connect your data in seconds' },
  { number: '2', title: 'Ingest', copy: 'Capture and unify your data' },
  { number: '3', title: 'Analyze', copy: 'Detect patterns and key insights' },
  { number: '4', title: 'Report', copy: 'Generate reports instantly' },
  { number: '5', title: 'Act', copy: 'Take action with confidence' },
  { number: '6', title: 'Impact', copy: 'Drive better outcomes together' },
]

const outcomes = [
  { title: 'Connect', copy: 'All Your Data' },
  { title: 'Ingest', copy: 'Any Format' },
  { title: 'Analyze', copy: 'AI-Powered Insights' },
  { title: 'Report', copy: 'Clear & Actionable' },
  { title: 'Act', copy: 'Drive Impact' },
  { title: 'Secure', copy: 'Enterprise Ready' },
  { title: 'Scale', copy: 'Built for Growth' },
]
*/

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
    <section className="relative hidden min-h-0 flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200/90 bg-slate-50 p-2 shadow-xl backdrop-blur-md lg:flex">
      {/* DISPLAYING THE EXACT SHOWCASE IMAGE AS REQUESTED */}
      <img
        src={showcaseImage}
        alt="echoAI Data Intelligence Platform Showcase"
        className="h-full w-full object-contain rounded-[1.75rem] shadow-sm"
      />
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
