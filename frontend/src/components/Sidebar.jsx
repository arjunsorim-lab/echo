import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Activity,
  ImageIcon,
  Ruler,
  Brain,
  FileText,
  Building2,
  BarChart3,
  Cog,
  Power,
} from 'lucide-react'

function Sidebar({ onSignOut }) {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/echo-studies', icon: Activity, label: 'Echo Studies' },
    { path: '/images', icon: ImageIcon, label: 'Images' },
    { path: '/measurements', icon: Ruler, label: 'Measurements' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Cog, label: 'Settings' },
    { path: '/ai-assistant', icon: Brain, label: 'AI Assistant', disabled: true },
    { path: '/crm', icon: Building2, label: 'CRM', disabled: true },
  ]

  return (
    <div className="relative min-h-screen w-64 shrink-0 overflow-y-auto bg-gradient-to-b from-[#449087] to-[#32635e] pb-24 text-white">
      <div className="border-b border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 shrink-0">
            <div className="absolute inset-0 rounded-full border-[3.5px] border-cyan-300 border-r-white" />
            <div className="absolute inset-1.5 rounded-full border-[3px] border-white border-l-cyan-300" />
            <div className="absolute inset-[0.8rem] rounded-full bg-white shadow-xs" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              echo<span className="text-cyan-200">AI</span>
            </h1>
            <p className="text-[11px] text-slate-200">Reporting System</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          if (item.disabled) {
            return (
              <button
                key={item.path}
                type="button"
                disabled
                title={`${item.label} is currently disabled`}
                className="flex w-full cursor-not-allowed items-center space-x-3 rounded-lg px-4 py-3 text-left text-white/45"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                    : 'text-white/90 hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-white/90 transition-colors duration-200 hover:bg-white/10"
        >
          <Power className="h-5 w-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 p-4">
        <div className="text-xs text-slate-300">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2026 Echo AI</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
