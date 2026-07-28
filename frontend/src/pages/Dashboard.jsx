import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Baby,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  Heart,
  MoreHorizontal,
  Search,
  Smile,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'
import { scanService } from '../api/scanService'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total_patients: 100,
    total_scans: 136,
    adult_echo: 81,
    fetal_echo: 25,
    pediatric_echo: 30,
    todays_visits: 0,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [department, setDepartment] = useState('Cardiology Department')
  const [selectedScanType, setSelectedScanType] = useState('All')

  useEffect(() => {
    scanService
      .getDashboardStats()
      .then((result) => {
        if (result.success && result.data) {
          setStats((prev) => ({
            ...prev,
            total_patients: result.data.total_patients || prev.total_patients,
            total_scans: result.data.total_scans || prev.total_scans,
            adult_echo: result.data.adult_echo || prev.adult_echo,
            fetal_echo: result.data.fetal_echo || prev.fetal_echo,
            pediatric_echo: result.data.pediatric_echo || prev.pediatric_echo,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.total_patients,
      change: '+12 this week',
      isPositive: true,
      icon: Users,
      bgColor: 'bg-blue-500',
      strokeColor: '#3b82f6',
      path: 'M0,22 Q15,28 30,18 T60,20 T90,12 T120,6',
    },
    {
      title: 'Total Scans',
      value: stats.total_scans,
      change: '+18 this week',
      isPositive: true,
      icon: Activity,
      bgColor: 'bg-emerald-500',
      strokeColor: '#10b981',
      path: 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,5',
    },
    {
      title: 'Adult Echo',
      value: stats.adult_echo,
      change: '+9 this week',
      isPositive: true,
      icon: Heart,
      bgColor: 'bg-purple-600',
      strokeColor: '#8b5cf6',
      path: 'M0,20 Q15,24 30,16 T60,22 T90,10 T120,7',
    },
    {
      title: 'Fetal Echo',
      value: stats.fetal_echo,
      change: '+4 this week',
      isPositive: true,
      icon: Baby,
      bgColor: 'bg-pink-500',
      strokeColor: '#ec4899',
      path: 'M0,26 Q15,22 30,24 T60,16 T90,20 T120,8',
    },
    {
      title: 'Pediatric Echo',
      value: stats.pediatric_echo,
      change: '+6 this week',
      isPositive: true,
      icon: Smile,
      bgColor: 'bg-orange-500',
      strokeColor: '#f97316',
      path: 'M0,24 Q15,26 30,20 T60,22 T90,14 T120,6',
    },
    {
      title: "Today's Visits",
      value: stats.todays_visits,
      change: 'No change',
      isPositive: false,
      icon: Calendar,
      bgColor: 'bg-blue-600',
      strokeColor: '#3b82f6',
      path: 'M0,16 L120,16',
    },
  ]

  const recentScans = [
    {
      id: 1,
      patientName: 'John Doe',
      mrn: 'MRN: 10023',
      demographics: '45M',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      scanType: 'Adult Echo',
      scanRoute: '/adult-echo-report',
      dateTime: 'May 26, 2025',
      timeStr: '09:35 AM',
      aiSummary: 'Mild LV hypertrophy with normal systolic function.',
      importance: 'Medium',
      confidence: 92,
    },
    {
      id: 2,
      patientName: 'Sarah Johnson',
      mrn: 'MRN: 10024',
      demographics: '62F',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      scanType: 'Adult Echo',
      scanRoute: '/adult-echo-report',
      dateTime: 'May 26, 2025',
      timeStr: '08:50 AM',
      aiSummary: 'Moderate mitral regurgitation detected.',
      importance: 'High',
      confidence: 95,
    },
    {
      id: 3,
      patientName: 'Michael Brown',
      mrn: 'MRN: 10025',
      demographics: '34M',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      scanType: 'Pediatric Echo',
      scanRoute: '/pediatric-echo-report',
      dateTime: 'May 25, 2025',
      timeStr: '04:15 PM',
      aiSummary: 'Small ASD with left to right shunt.',
      importance: 'Medium',
      confidence: 90,
    },
    {
      id: 4,
      patientName: 'Emily Davis',
      mrn: 'MRN: 10026',
      demographics: '28F',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      scanType: 'Fetal Echo',
      scanRoute: '/fetal-echo-report',
      dateTime: 'May 25, 2025',
      timeStr: '02:40 PM',
      aiSummary: 'Normal fetal cardiac structures.',
      importance: 'Low',
      confidence: 93,
    },
    {
      id: 5,
      patientName: 'David Wilson',
      mrn: 'MRN: 10027',
      demographics: '55M',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      scanType: 'Adult Echo',
      scanRoute: '/adult-echo-report',
      dateTime: 'May 25, 2025',
      timeStr: '11:20 AM',
      aiSummary: 'Aortic valve sclerosis without stenosis.',
      importance: 'Low',
      confidence: 88,
    },
    {
      id: 6,
      patientName: 'Lisa Martinez',
      mrn: 'MRN: 10028',
      demographics: '41F',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      scanType: 'Adult Echo',
      scanRoute: '/adult-echo-report',
      dateTime: 'May 24, 2025',
      timeStr: '03:30 PM',
      aiSummary: 'Reduced LVEF (45%) with global hypokinesia.',
      importance: 'High',
      confidence: 94,
    },
    {
      id: 7,
      patientName: 'Daniel Taylor',
      mrn: 'MRN: 10029',
      demographics: '7M',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      scanType: 'Pediatric Echo',
      scanRoute: '/pediatric-echo-report',
      dateTime: 'May 24, 2025',
      timeStr: '10:05 AM',
      aiSummary: 'Pulmonary valve stenosis (mild).',
      importance: 'Medium',
      confidence: 91,
    },
    {
      id: 8,
      patientName: 'Olivia Anderson',
      mrn: 'MRN: 10030',
      demographics: '31F',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      scanType: 'Fetal Echo',
      scanRoute: '/fetal-echo-report',
      dateTime: 'May 23, 2025',
      timeStr: '05:45 PM',
      aiSummary: 'Suspected VSD, recommend follow-up.',
      importance: 'High',
      confidence: 89,
    },
    {
      id: 9,
      patientName: 'James Thomas',
      mrn: 'MRN: 10031',
      demographics: '66M',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      scanType: 'Adult Echo',
      scanRoute: '/adult-echo-report',
      dateTime: 'May 23, 2025',
      timeStr: '01:15 PM',
      aiSummary: 'Severe tricuspid regurgitation.',
      importance: 'High',
      confidence: 96,
    },
    {
      id: 10,
      patientName: 'Sophia Garcia',
      mrn: 'MRN: 10032',
      demographics: '3F',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      scanType: 'Pediatric Echo',
      scanRoute: '/pediatric-echo-report',
      dateTime: 'May 23, 2025',
      timeStr: '09:20 AM',
      aiSummary: 'Normal study.',
      importance: 'Low',
      confidence: 85,
    },
  ]

  const filteredScans = recentScans.filter((scan) => {
    const matchesSearch =
      !searchQuery ||
      scan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.aiSummary.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedScanType === 'All' || scan.scanType === selectedScanType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Top Department Header */}
      <div className="flex items-center justify-end">
        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Stethoscope className="h-4 w-4 text-teal-600" />
            <span>{department}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 6 Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs ${card.bgColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{card.title}</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {card.isPositive ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" />
                      {card.change}
                    </span>
                  ) : (
                    <span className="font-medium text-slate-400">{card.change}</span>
                  )}
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="w-24 h-12 flex items-center justify-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30">
                  <path
                    d={card.path}
                    fill="none"
                    stroke={card.strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Top 10 Recent Scans Main Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Top 10 Recent Scans</h3>
            <p className="text-xs text-slate-500">Latest echo scans with AI analysis and clinical importance</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by patient, ID, or ref no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1">
              {['All', 'Adult Echo', 'Fetal Echo', 'Pediatric Echo'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedScanType(type)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    selectedScanType === type
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Date Range Button */}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>May 20 - May 26, 2025</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Export Button */}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Scan Type</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">AI Findings (Summary)</th>
                <th className="py-3 px-4">Clinical Importance</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredScans.map((scan, idx) => (
                <tr
                  key={scan.id}
                  onClick={() => navigate(`${scan.scanRoute}?patientId=${scan.id}&scatter=true`)}
                  className="group cursor-pointer transition hover:bg-teal-50/30"
                >
                  {/* Row # */}
                  <td className="py-3.5 px-4 text-slate-400 font-medium">{idx + 1}</td>

                  {/* Patient Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={scan.avatar}
                        alt={scan.patientName}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                          {scan.patientName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {scan.mrn} · {scan.demographics}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Scan Type Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        scan.scanType === 'Adult Echo'
                          ? 'bg-purple-100 text-purple-700'
                          : scan.scanType === 'Fetal Echo'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {scan.scanType}
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{scan.dateTime}</p>
                    <p className="text-[11px] text-slate-400">{scan.timeStr}</p>
                  </td>

                  {/* AI Findings Summary */}
                  <td className="py-3.5 px-4 max-w-xs font-medium text-slate-700">
                    {scan.aiSummary}
                  </td>

                  {/* Clinical Importance Pill */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-semibold border ${
                        scan.importance === 'High'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : scan.importance === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      {scan.importance}
                    </span>
                  </td>

                  {/* AI Confidence Bar */}
                  <td className="py-3.5 px-4 w-36">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800">{scan.confidence}%</span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${scan.confidence}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Action Icon Buttons */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}?patientId=${scan.id}&scatter=true`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="View Report"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`${scan.scanRoute}?patientId=${scan.id}&scatter=true`)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition"
                        title="View Document"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing <span className="font-semibold text-slate-800">1</span> to{' '}
            <span className="font-semibold text-slate-800">10</span> of{' '}
            <span className="font-semibold text-slate-800">136</span> scans
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    page === 1
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-slate-400">...</span>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                14
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <select className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700">
              <option>10 / page</option>
              <option>25 / page</option>
              <option>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
