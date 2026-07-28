import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import {
  CalendarDays,
  Pencil,
  RefreshCw,
  Search as SearchIcon,
  UserPlus,
} from 'lucide-react'

function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitles = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/search': 'Patient Search',
    '/patients': 'Patients',
    '/patients/new': 'New Patient',
    '/visits': 'Visits',
    '/referral-doctors': 'Referral Doctors',
    '/echo-studies': 'Echo Studies',
    '/fetal-echo-report': 'Fetal Echo Report',
    '/adult-echo-report': 'Adult Echo Report',
    '/pediatric-echo-report': 'Pediatric Echo Report',
    '/echo-scan': 'Echo Scan',
    '/images': 'Images & DICOM',
    '/measurements': 'Measurements',
    '/reports': 'Clinical Reports',
    '/analytics': 'Queries & Analytics',
    '/settings': 'Settings',
    '/administration': 'Administration',
    '/crm': 'CRM',
    '/ai-assistant': 'AI Assistant',
  }

  const pageTitle =
    Object.entries(pageTitles).find(
      ([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    )?.[1] || 'CardioEcho AI'

  const handleSearch = (e) => {
    e?.preventDefault()
    navigate('/search')
  }

  const handleRefresh = () => {
    navigate('/search')
    setTimeout(() => window.location.reload(), 100)
  }

  const handleSignOut = () => {
    sessionStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_google_access_token')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
      <Sidebar onSignOut={handleSignOut} />
      <div className="flex h-full min-w-0 flex-1 flex-col px-1 py-1 sm:px-2 lg:px-3">
        <header className="mb-3 flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3" aria-label="Echo AI">
            <div className="relative h-11 w-11 shrink-0">
              <div className="absolute inset-0 rounded-full border-[3.5px] border-blue-400 border-r-violet-500" />
              <div className="absolute inset-1.5 rounded-full border-[3px] border-indigo-500 border-l-cyan-400" />
              <div className="absolute inset-[0.85rem] rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 shadow-xs" />
            </div>
            <p className="text-2xl font-black tracking-tight text-[#08145f]">
              Echo <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">AI</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className={`toolbar-button ${
                location.pathname === '/search'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              <SearchIcon className="h-4 w-4" />
              <span className={location.pathname === '/search' ? 'font-semibold' : ''}>Search</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/patients/new')}
              className={`toolbar-button ${
                location.pathname === '/patients/new'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span className={location.pathname === '/patients/new' ? 'font-semibold' : ''}>New patient</span>
            </button>
            <button type="button" className="toolbar-button" onClick={() => navigate('/patients')}>
              <Pencil className="h-4 w-4" />
              <span>Edit patient</span>
            </button>
            <button type="button" className="toolbar-button" onClick={() => navigate('/visits')}>
              <CalendarDays className="h-4 w-4" />
              <span>Visits</span>
            </button>
            <button type="button" onClick={handleRefresh} className="toolbar-button">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pb-3">
          <div className="shrink-0 px-1 pt-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{pageTitle}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
