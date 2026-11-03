import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search = lazy(() => import('./pages/Search'))
const NewPatient = lazy(() => import('./pages/NewPatient'))
const Patients = lazy(() => import('./pages/Patients'))
const EditPatient = lazy(() => import('./pages/EditPatient'))
const PatientRecords = lazy(() => import('./pages/PatientRecords'))
const Visits = lazy(() => import('./pages/Visits'))
const ReferralDoctors = lazy(() => import('./pages/ReferralDoctors'))
const NewReferralDoctor = lazy(() => import('./pages/NewReferralDoctor'))
const EditReferralDoctor = lazy(() => import('./pages/EditReferralDoctor'))
const ImagesViewer = lazy(() => import('./pages/ImagesViewer'))
const Measurements = lazy(() => import('./pages/Measurements'))
const Reports = lazy(() => import('./pages/Reports'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Administration = lazy(() => import('./pages/Administration'))
const Settings = lazy(() => import('./pages/Settings'))
const Home = lazy(() => import('./pages/Home'))
const FetalEchoReport = lazy(() => import('./pages/FetalEchoReport'))
const AdultEchoReport = lazy(() => import('./pages/AdultEchoReport'))
const PediatricEchoReport = lazy(() => import('./pages/PediatricEchoReport'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const CRM = lazy(() => import('./pages/CRM'))
const EchoScan = lazy(() => import('./pages/EchoScan'))
const EchoStudies = lazy(() => import('./pages/EchoStudies'))

function isSignedIn() {
  return Boolean(
    sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token'),
  )
}

function ProtectedPage({ children }) {
  if (!isSignedIn()) {
    return <Navigate to="/" replace />
  }

  return <Layout>{children}</Layout>
}

function LoginRoute() {
  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.get('signout') === '1') {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    sessionStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_user')
    localStorage.removeItem('echoai_google_access_token')
    sessionStorage.removeItem('echoai_token')
    localStorage.removeItem('echoai_token')
    window.history.replaceState({}, document.title, '/')
    return <Home />
  }

  return isSignedIn() ? <Navigate to="/dashboard" replace /> : <Home />
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>}>
        <Routes>
        <Route path="/" element={<LoginRoute />} />
        <Route path="/dashboard" element={
          <ProtectedPage><Dashboard /></ProtectedPage>
        } />
        <Route path="/search" element={
          <ProtectedPage><Search /></ProtectedPage>
        } />
        <Route path="/new-patient" element={
          <ProtectedPage><NewPatient /></ProtectedPage>
        } />
        <Route path="/patients" element={
          <ProtectedPage><Patients /></ProtectedPage>
        } />
        <Route path="/patients/new" element={
          <ProtectedPage><NewPatient /></ProtectedPage>
        } />
        <Route path="/patients/:id/edit" element={
          <ProtectedPage><EditPatient /></ProtectedPage>
        } />
        <Route path="/patients/:id/records" element={
          <ProtectedPage><PatientRecords /></ProtectedPage>
        } />
        <Route path="/visits" element={
          <ProtectedPage><Visits /></ProtectedPage>
        } />
        <Route path="/referral-doctors" element={
          <ProtectedPage><ReferralDoctors /></ProtectedPage>
        } />
        <Route path="/referral-doctors/new" element={
          <ProtectedPage><NewReferralDoctor /></ProtectedPage>
        } />
        <Route path="/referral-doctors/edit/:id" element={
          <ProtectedPage><EditReferralDoctor /></ProtectedPage>
        } />
        <Route path="/echo-studies" element={
          <ProtectedPage><EchoStudies /></ProtectedPage>
        } />
        <Route path="/fetal-echo-report" element={
          <ProtectedPage><FetalEchoReport /></ProtectedPage>
        } />
        <Route path="/fetal-echo-report/:scanId" element={
          <ProtectedPage><FetalEchoReport /></ProtectedPage>
        } />
        <Route path="/adult-echo-report" element={
          <ProtectedPage><AdultEchoReport /></ProtectedPage>
        } />
        <Route path="/adult-echo-report/:scanId" element={
          <ProtectedPage><AdultEchoReport /></ProtectedPage>
        } />
        <Route path="/pediatric-echo-report" element={
          <ProtectedPage><PediatricEchoReport /></ProtectedPage>
        } />
        <Route path="/pediatric-echo-report/:scanId" element={
          <ProtectedPage><PediatricEchoReport /></ProtectedPage>
        } />
        <Route path="/echo-scan" element={
          <ProtectedPage><EchoScan /></ProtectedPage>
        } />
        <Route path="/echo-scan/:scanId" element={
          <ProtectedPage><EchoScan /></ProtectedPage>
        } />
        <Route path="/images" element={
          <ProtectedPage><ImagesViewer /></ProtectedPage>
        } />
        <Route path="/measurements" element={
          <ProtectedPage><Measurements /></ProtectedPage>
        } />
        <Route path="/ai-assistant" element={
          <ProtectedPage><AIAssistant /></ProtectedPage>
        } />
        <Route path="/reports" element={
          <ProtectedPage><Reports /></ProtectedPage>
        } />
        <Route path="/crm" element={
          <ProtectedPage><CRM /></ProtectedPage>
        } />
        <Route path="/analytics" element={
          <ProtectedPage><Analytics /></ProtectedPage>
        } />
        <Route path="/administration" element={
          <ProtectedPage><Administration /></ProtectedPage>
        } />
        <Route path="/settings" element={
          <ProtectedPage><Settings /></ProtectedPage>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
