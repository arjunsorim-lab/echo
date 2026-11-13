import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Calendar,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  User,
  Plus,
  Trash2,
  Activity,
  Building,
} from 'lucide-react'
import { patientService } from '../api/patientService'
import { workspaceService } from '../api/workspaceService'
import AddableSelect from '../components/AddableSelect'
import ReferralDoctorModal from '../components/ReferralDoctorModal'
import { referralDoctorService } from '../api/referralDoctorService'
import {
  getStatesForCountry,
  getCitiesForState,
  getDialCode,
  lookupPincode,
  calculateAge,
  calculateAgeWithUnit,
  calculateAgeForUnit,
  COUNTRY_DIAL_CODES,
} from '../data/locationData'

function NewPatient() {
  const navigate = useNavigate()
  const registrationId = useRef(crypto.randomUUID())
  const patientIdCheck = useRef(0)
  const [patientIdError, setPatientIdError] = useState('')
  const [checkingPatientId, setCheckingPatientId] = useState(false)
  const checkPatientId = async (value) => {
    const id = value.trim()
    const check = ++patientIdCheck.current
    if (!id) { setPatientIdError(''); setCheckingPatientId(false); return }
    setCheckingPatientId(true)
    try {
      const result = await patientService.checkPatientId(id)
      if (check === patientIdCheck.current) setPatientIdError(result.available ? '' : 'This Patient ID already exists. Enter a different ID.')
    } catch {
      if (check === patientIdCheck.current) setPatientIdError('Unable to check Patient ID. It will be checked when you save.')
    } finally {
      if (check === patientIdCheck.current) setCheckingPatientId(false)
    }
  }
  const handleFieldFocus = (event) => {
    const target = event.target
    if (target.matches('input[type="text"], input[type="tel"], input[type="email"], input[type="number"]') && target.matches(':focus-visible') && target.type !== 'number') {
      target.select()
    }
  }
  const [formData, setFormData] = useState({
    patient_id: '',
    salutation: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    age: '',
    age_unit: 'Years',
    dob: '',
    gender: 'M',
    marital_status: '',
    ethnic_origin: '',
    street: '',
    zip_code: '',
    country: 'India',
    state: '',
    district_city: '',
    email: '',
    phone1: '',
    phone2: '',
    mobile: '',
    fax: '',
    aadhaar_no: '',
    family_doctor: '',
    taluk: '',
    area: '',
    area_po: '',
  })

  const [visits, setVisits] = useState([])
  const [templates, setTemplates] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)
  const [referralOptions, setReferralOptions] = useState([])
  const [zipLookupStatus, setZipLookupStatus] = useState('')

  const countries = Object.keys(COUNTRY_DIAL_CODES)
  const availableStates = getStatesForCountry(formData.country)
  const availableCities = getCitiesForState(formData.state)
  const ethnicOrigins = ['Indian', 'Asian', 'African', 'European', 'Other']
  const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Baby', 'Master']
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed']

  useEffect(() => {
    workspaceService.getTemplates().then((result) => setTemplates(result.data || [])).catch(() => setTemplates([]))
    referralDoctorService.getReferralDoctors()
      .then((result) => setReferralOptions((result.data || []).map((record) => record.institution_name || record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim()).filter(Boolean)))
      .catch(() => setReferralOptions([]))
  }, [])

  const handleDobChange = useCallback((dob) => {
    const calculated = calculateAgeWithUnit(dob)
    setFormData(prev => ({
      ...prev,
      dob,
      age: calculated.age,
      age_unit: calculated.unit || prev.age_unit || 'Years'
    }))
  }, [])

  const handleCountryChange = useCallback((country) => {
    const code = getDialCode(country)
    setFormData(prev => ({ ...prev, country, state: '', district_city: '' }))
    setZipLookupStatus('')
  }, [])

  const handleStateChange = useCallback((state) => {
    setFormData(prev => ({ ...prev, state, district_city: '' }))
  }, [])

  const handleZipChange = useCallback((zip) => {
    setFormData(prev => ({ ...prev, zip_code: zip }))
    if (zip.trim().length === 6) {
      const info = lookupPincode(zip.trim())
      if (info) {
        setFormData(prev => ({ ...prev, zip_code: zip, taluk: info.taluk, area_po: info.post, district_city: info.district || prev.district_city }))
        setZipLookupStatus('found')
      } else { setZipLookupStatus('notfound') }
    } else { setZipLookupStatus('') }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const shouldGoToReport = e.nativeEvent.submitter?.value === 'reporting'
    if (shouldGoToReport && !visits.some((visit) => visit.scan_type)) {
      setSubmitError('Add a visit and select a scan type before continuing.')
      return
    }
    if (visits.some((visit) => !visit.visit_date || !visit.scan_type || !visit.referral_doctor.trim())) {
      setSubmitError('Enter a visit date, scan type, and referral doctor or institute for each visit.')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const visitDrafts = visits
      const result = await patientService.createRegistration({ request_id: registrationId.current, patient: formData, visits: visitDrafts })
      const patient = result.data
      const createdVisits = result.visits
      const reportIndex = visitDrafts.findIndex((visit) => visit.scan_type)
      if (shouldGoToReport && reportIndex >= 0) navigate(`/echo-studies?patient=${patient.id}&visit=${createdVisits[reportIndex]?.id || ''}&type=${encodeURIComponent(visitDrafts[reportIndex].scan_type)}`)
      else navigate('/search')
    } catch (error) {
      console.error('Error creating patient:', error)
      setSubmitError(error.response?.data?.detail || 'Unable to create the patient. Please check the required fields and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVisit = () => {
    const now = new Date();
    const formattedDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setVisits([...visits, { id: Date.now(), visit_date: formattedDateTime, referral_doctor: formData.family_doctor || '', scan_type: '', report_template_id: '', notes: '' }])
  }
  const handleUpdateVisit = (id, field, value) => setVisits(visits.map(v => v.id === id ? { ...v, [field]: value } : v))
  const handleDeleteVisit = (id) => setVisits(visits.filter(v => v.id !== id))

  const inputClass = "w-full min-w-0 h-11 px-3.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
  const selectClass = "w-full min-w-0 h-11 px-3.5 border border-slate-300 rounded-lg bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
  const labelClass = "block text-xs font-semibold text-slate-700 mb-2"
  const dialCode = getDialCode(formData.country)

  return (
    <>
      <form onSubmit={handleSubmit} onFocus={handleFieldFocus} className="h-full overflow-auto bg-slate-100/70 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Patient registration</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">New patient</h1>
              <p className="mt-1 text-sm text-slate-500">Enter patient details and add a visit to begin a report.</p>
            </div>
            <p className="text-xs font-medium text-slate-500"><span className="text-teal-700">*</span> Required fields</p>
          </div>
          <div className="w-full">
            {/* Main Form */}
            <div className="space-y-5">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-teal-600" /> Basic Information
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5">
                    <div>
                      <label className={labelClass}>Patient ID *</label>
                      <input type="text" className={inputClass} value={formData.patient_id} onChange={(e) => { patientIdCheck.current++; setCheckingPatientId(false); setPatientIdError(''); setFormData({ ...formData, patient_id: e.target.value }) }} onBlur={(e) => checkPatientId(e.target.value)} aria-invalid={patientIdError.startsWith('This Patient ID') || undefined} aria-describedby={patientIdError || checkingPatientId ? 'patient-id-status' : undefined} required placeholder="e.g., TM0012026" />
                      {(patientIdError || checkingPatientId) && <p id="patient-id-status" role="status" className={`mt-1.5 text-xs ${patientIdError.startsWith('This Patient ID') ? 'text-red-600' : 'text-slate-500'}`}>{checkingPatientId ? 'Checking Patient ID…' : patientIdError}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Salutation</label>
                      <AddableSelect skipAddOnTab field="patient_salutation" className={selectClass} options={salutations} value={formData.salutation} onChange={(value) => setFormData({ ...formData, salutation: value })} />
                    </div>
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input type="text" className={inputClass} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className={labelClass}>Parent / Spouse Name</label>
                      <input type="text" className={inputClass} value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Middle Name</label>
                      <input type="text" className={inputClass} value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Date of Birth *</label>
                      <div className="relative">
                        <input type="date" className={inputClass} value={formData.dob} onChange={(e) => handleDobChange(e.target.value)} required />
                      </div>
                      {formData.dob && formData.age && (
                        <p className="mt-1 text-xs text-teal-600 font-medium">
                          Age: {formData.age} {formData.age_unit || 'Years'}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Age</label>
                        <input type="number" className={inputClass} value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" />
                      </div>
                      <div>
                        <label className={labelClass}>Unit</label>
                        <select
                          className={selectClass}
                          value={formData.age_unit || 'Years'}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            const newAge = formData.dob ? calculateAgeForUnit(formData.dob, newUnit) : formData.age;
                            setFormData({ ...formData, age_unit: newUnit, age: newAge });
                          }}
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <div role="radiogroup" aria-label="Gender" className="flex items-center gap-3 min-h-11">
                        {['M', 'F', 'UA'].map(g => (
                          <label key={g} className="flex items-center gap-1.5 cursor-pointer rounded-md px-1 py-0.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2">
                            <input type="radio" name="gender" tabIndex={0} onKeyDown={(event) => {
                              if (event.key !== 'Tab') return
                              const radios = [...event.currentTarget.closest('[role="radiogroup"]').querySelectorAll('input[type="radio"]')]
                              const next = radios[radios.indexOf(event.currentTarget) + (event.shiftKey ? -1 : 1)]
                              if (next) { event.preventDefault(); next.focus() }
                            }} value={g} checked={formData.gender === g} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-4 h-4 text-teal-600 focus:ring-teal-500" />
                            <span className="text-sm text-slate-700">{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Marital Status</label>
                      <AddableSelect skipAddOnTab field="patient_marital_status" className={selectClass} options={maritalStatuses} value={formData.marital_status} onChange={(value) => setFormData({ ...formData, marital_status: value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Ethnic Origin</label>
                      <AddableSelect skipAddOnTab field="patient_ethnic_origin" className={selectClass} options={ethnicOrigins} value={formData.ethnic_origin} onChange={(value) => setFormData({ ...formData, ethnic_origin: value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-teal-700" /> Address Information
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
                    <div className="lg:col-span-2">
                      <label className={labelClass}>Street Address</label>
                      <input type="text" className={inputClass} value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Taluk</label>
                      <input type="text" className={inputClass} value={formData.taluk} onChange={(e) => setFormData({ ...formData, taluk: e.target.value })} placeholder="Auto-filled by zip code" />
                    </div>
                    <div>
                      <label className={labelClass}>Area</label>
                      <input type="text" className={inputClass} value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Area (P.O.)</label>
                      <div className="flex gap-2">
                        <input type="text" className={inputClass} value={formData.area_po} onChange={(e) => setFormData({ ...formData, area_po: e.target.value })} placeholder="Auto-filled by zip code" />
                        <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm whitespace-nowrap">Add / Modify</button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Zip Code</label>
                      <input type="text" className={inputClass} value={formData.zip_code} onChange={(e) => handleZipChange(e.target.value)} maxLength={10} placeholder="Enter zip / pincode" />
                      {zipLookupStatus === 'found' && <p className="mt-1 text-xs text-teal-600 font-medium">✓ Taluk &amp; Post auto-filled</p>}
                      {zipLookupStatus === 'notfound' && <p className="mt-1 text-xs text-amber-500 font-medium">Pincode not in database — fill manually</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <AddableSelect skipAddOnTab field="patient_country" className={selectClass} options={countries} value={formData.country} onChange={handleCountryChange} />
                      {dialCode && <p className="mt-1 text-xs text-slate-500">Dial code: <span className="font-semibold text-slate-700">{dialCode}</span></p>}
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <AddableSelect skipAddOnTab field="patient_state" className={selectClass} options={availableStates} value={formData.state} onChange={handleStateChange} />
                    </div>
                    <div>
                      <label className={labelClass}>District/City</label>
                      <AddableSelect skipAddOnTab field="patient_district_city" className={selectClass} options={availableCities} value={formData.district_city} onChange={(value) => setFormData({ ...formData, district_city: value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-teal-700" /> Contact Information
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
                    <div>
                      <label className={labelClass}>Mobile # *</label>
                      <div className="flex gap-1">
                        {dialCode && <span className="flex items-center px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 whitespace-nowrap select-none">{dialCode}</span>}
                        <input type="tel" className={`${inputClass} flex-1`} value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} placeholder="Mobile number" required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Phone #1</label>
                      <input type="tel" className={inputClass} value={formData.phone1} onChange={(e) => setFormData({ ...formData, phone1: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone #2</label>
                      <input type="tel" className={inputClass} value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Fax #</label>
                      <input type="text" className={inputClass} value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Email *</label>
                      <div className="relative">
                        <input type="email" className={`${inputClass} pl-10`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-teal-600" /> Additional Information
                  </h2>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Aadhaar No</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={formData.aadhaar_no}
                        onChange={(e) => setFormData({ ...formData, aadhaar_no: e.target.value })}
                        placeholder="XXXX XXXX XXXX"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Referral Doctor/Institute</label>
                      <div className="flex flex-wrap sm:flex-nowrap gap-2">
                        <input className={inputClass} list="referral-options" value={formData.family_doctor} onChange={(event) => setFormData({ ...formData, family_doctor: event.target.value })} placeholder="Enter or select doctor / institute" />
                        <button type="button" onClick={() => setIsReferralModalOpen(true)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-medium text-teal-700 whitespace-nowrap hover:bg-teal-100">+ New referral doctor</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visits Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-teal-600" /> Visits
                  </h2>
                  <button type="button" onClick={handleAddVisit} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"><Plus className="h-4 w-4" /> Add visit</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead className="bg-slate-50/70">
                      <tr>
                        {['No.', 'Visit Date *', 'Scan Type *', 'Report Template', 'Referral Doctor / Institute *', 'Notes', 'Action'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase${h === 'Action' ? ' text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                  {visits.length === 0 ? (
                        <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No visits added yet. Add a visit to choose a scan type.</td></tr>
                      ) : visits.map((visit, index) => (
                        <tr key={visit.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                          <td className="px-4 py-3"><input type="datetime-local" className={inputClass} value={visit.visit_date?.slice(0, 16)} onChange={(e) => handleUpdateVisit(visit.id, 'visit_date', e.target.value)} required aria-label="Visit date" /></td>
                          <td className="px-4 py-3"><select className={selectClass} value={visit.scan_type} onChange={(e) => handleUpdateVisit(visit.id, 'scan_type', e.target.value)} required aria-label="Scan type"><option value="">Select scan</option>{['Adult Echo', 'Fetal Echo', 'Pediatric Echo', 'Ultrasound'].map(type => <option key={type} value={type}>{type}</option>)}</select></td>
                          <td className="px-4 py-3"><select className={selectClass} value={visit.report_template_id} onChange={(e) => handleUpdateVisit(visit.id, 'report_template_id', e.target.value)}><option value="">Select template</option>{templates.filter(t => !t.scan_type || t.scan_type === visit.scan_type).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></td>
                          <td className="px-4 py-3"><input type="text" list="referral-options" className={inputClass} value={visit.referral_doctor} onChange={(e) => handleUpdateVisit(visit.id, 'referral_doctor', e.target.value)} placeholder="Enter or select" required aria-label="Referral doctor or institute" /></td>
                          <td className="px-4 py-3"><input type="text" className={inputClass} value={visit.notes} onChange={(e) => handleUpdateVisit(visit.id, 'notes', e.target.value)} placeholder="Notes" /></td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => handleDeleteVisit(visit.id)} aria-label="Remove visit" className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-5 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:px-6">
            {submitError && (
              <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">{submitError}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => navigate('/search')} className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-2 text-sm font-medium">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" value="save" disabled={isSubmitting} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save</button>
                <button type="submit" value="reporting" disabled={isSubmitting} className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Save & Next'} <ArrowRight className="inline-block ml-1 h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <datalist id="referral-options">{referralOptions.map((option) => <option key={option} value={option} />)}</datalist>
      <ReferralDoctorModal
        open={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        onSaved={(record) => {
          const name = record.institution_name || record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim()
          if (name) {
            setReferralOptions(prev => [...new Set([...prev, name])])
            setFormData(prev => ({ ...prev, family_doctor: name }))
          }
        }}
        onSelect={(record) => { const name = record.institution_name || record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim(); setFormData(prev => ({ ...prev, family_doctor: name })); setReferralOptions(prev => [...new Set([...prev, name])]) }}
      />
    </>
  )
}

export default NewPatient
