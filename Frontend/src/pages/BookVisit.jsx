import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createAppointment, getRoleForUser } from '../data/appointmentsStore'

const CATALOG = [
  { id: 'alden', name: 'Dr. Alex', specialty: 'Neurologist', location: 'Guinayangan' },
  { id: 'Malupiton', name: 'Dr. Ben', specialty: 'Surgeon', location: 'Balatan, Camarines Sur' },
  { id: 'coco', name: 'Dr. Lei', specialty: 'Psychiatrist', location: 'Sariaya' },
]

const tomorrowLocalDate = () => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

const BookVisit = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const role = getRoleForUser(user.uid)
  if (role !== 'patient') return <Navigate to="/profile" replace />

  const [doctorId, setDoctorId] = useState(CATALOG[0]?.id || '')
  const [patientName, setPatientName] = useState(user.displayName || '')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [date, setDate] = useState(tomorrowLocalDate())
  const [time, setTime] = useState(TIME_SLOTS[0])
  const [paymentMethod, setPaymentMethod] = useState('gcash')
  const [triageLevel, setTriageLevel] = useState('routine')
  const [visitType, setVisitType] = useState('first-time')
  const [symptoms, setSymptoms] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const doctor = useMemo(() => CATALOG.find((d) => d.id === doctorId) || null, [doctorId])

  return (
    <section className="py-14">
      <div className="container">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[30px] font-[900] text-headingColor">Book a Visit</h1>
              <p className="mt-2 text-textColor">
                Pick a doctor, select a date/time, and tell us what you need.
              </p>
            </div>
          </div>

          <form
            className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10"
            onSubmit={async (e) => {
              e.preventDefault()
              if (submitting) return

              const nameTrimmed = patientName.trim()
              const ageNum = Number(age)
              const addressTrimmed = address.trim()

              if (!doctor) return alert('Please select a doctor.')
              if (!nameTrimmed) return alert('Please enter your name.')
              if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 150) return alert('Please enter a valid age.')
              if (!addressTrimmed) return alert('Please enter your address.')
              if (!date || !time) return alert('Please choose a date and time.')

              const scheduled = new Date(`${date}T${time}`)
              if (!Number.isFinite(scheduled.getTime())) return alert('Invalid date/time.')
              if (scheduled.getTime() < Date.now()) return alert('Please choose a future date/time.')

              try {
                setSubmitting(true)
                createAppointment({
                  doctorId: doctor.id,
                  doctorName: doctor.name,
                  doctorSpecialty: doctor.specialty,
                  doctorLocation: doctor.location,
                  patientUid: user.uid,
                  patientName: nameTrimmed,
                  patientEmail: user.email || '',
                  patientAge: ageNum,
                  patientAddress: addressTrimmed,
                  paymentMethod,
                  triageLevel,
                  visitType,
                  symptoms,
                  status: 'pending',
                  scheduledAt: scheduled.toISOString(),
                })
                navigate('/profile')
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Visit details</h2>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Doctor</span>
                    <select
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                    >
                      {CATALOG.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialty}
                        </option>
                      ))}
                    </select>
                    {doctor?.location && <p className="mt-2 text-[12px] text-textColor">Address: {doctor.location}</p>}
                  </label>

                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Visit type</span>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVisitType('first-time')}
                        disabled={submitting}
                        className={[
                          'h-12 rounded-xl border font-[900] transition',
                          visitType === 'first-time'
                            ? 'bg-primaryColor text-white border-primaryColor'
                            : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                          submitting ? 'opacity-60 cursor-not-allowed' : '',
                        ].join(' ')}
                      >
                        First-time
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitType('follow-up')}
                        disabled={submitting}
                        className={[
                          'h-12 rounded-xl border font-[900] transition',
                          visitType === 'follow-up'
                            ? 'bg-primaryColor text-white border-primaryColor'
                            : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                          submitting ? 'opacity-60 cursor-not-allowed' : '',
                        ].join(' ')}
                      >
                        Follow-up
                      </button>
                    </div>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-[13px] font-[800] text-headingColor">Triage level</span>
                    <select
                      value={triageLevel}
                      onChange={(e) => setTriageLevel(e.target.value)}
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                    >
                      <option value="emergency">Emergency</option>
                      <option value="urgent">Urgent</option>
                      <option value="routine">Routine</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Date</span>
                    <input
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      type="date"
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                      required
                    />
                  </label>

                  <div className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Time slot</span>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          disabled={submitting}
                          className={[
                            'h-11 rounded-xl border text-[13px] font-[900] transition',
                            time === t
                              ? 'bg-primaryColor text-white border-primaryColor'
                              : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                            submitting ? 'opacity-60 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block md:col-span-2">
                    <span className="text-[13px] font-[800] text-headingColor">Symptom shortlist</span>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      rows={4}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      placeholder="Briefly describe why you’re booking (e.g., headache for 3 days, dizziness)."
                      disabled={submitting}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Patient info</h2>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Name</span>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Age</span>
                    <input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      type="number"
                      min="0"
                      max="150"
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Address</span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Mode of payment</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      disabled={submitting}
                    >
                      <option value="gcash">GCash</option>
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  )}
                  {submitting ? 'Booking...' : 'Book visit'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default BookVisit
