import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { createAppointment, getRoleForUser } from '../../data/appointmentsStore.js'
import { getDoctorAvailability } from '../../data/doctorAvailabilityStore.js'
import { listMessages, sendMessage } from '../../data/messagesStore.js'
import AppointmentBookingModal from '../../components/AppointmentBookingModal.jsx'

import malupitonImg from '../../assets/images/malupiton.png'
import aldenImg from '../../assets/images/alden.png'
import cocoImg from '../../assets/images/coco.png'
import alexImg from '../../assets/images/alex.png'
import docBenImg from '../../assets/images/docben.png'
import docLeiImg from '../../assets/images/doclei.png'

const doctorImageById = {
  ben: docBenImg,
  alex: alexImg,
  lei: docLeiImg,
}

const doctorOverridesById = {
  alex: {
    name: 'Dr. Alex',
    specialty: 'Neurologist',
    location: 'Guinayangan',
    img: alexImg,
  },
  ben: {
    name: 'Dr. Ben',
    specialty: 'Surgeon',
    location: 'Balatan, Camarines Sur',
    img: docBenImg,
  },
  lei: {
    name: 'Dr. Lei',
    specialty: 'Psychiatrist',
    location: 'Sariaya',
    img: docLeiImg,
  },
}

const DOCTOR_FALLBACK_BY_ID = {
  ben: '/images/malupiton.png',
  alex: '/images/alden.png',
  lei: '/images/coco.png',
}

const applyImgFallback = (fallbackSrc) => (e) => {
  const img = e.currentTarget
  if (!fallbackSrc || img.dataset.fallbackApplied) return
  img.dataset.fallbackApplied = '1'
  img.src = fallbackSrc
}

const DEFAULT_AVAILABILITY_BY_ID = {
  ben: { days: ['sunday', 'tuesday', 'thursday'], times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'] },
  alex: { days: ['monday', 'wednesday'], times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'] },
  lei: { days: ['friday', 'saturday'], times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'] },
}

const weekdayLong = (day) => String(day || '').slice(0, 1).toUpperCase() + String(day || '').slice(1)

const formatTime = (hhmm) => {
  const [hStr, mStr] = String(hhmm || '').split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(hhmm || '')
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }).toLowerCase()
}

const Stars = ({ value = 0, size = 14, className = '' }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <div className={['flex items-center gap-1', className].join(' ')} aria-label={`${v} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(v)
        return <FaStar key={i} className={filled ? 'text-yellowColor' : 'text-[#d7dee8]'} style={{ fontSize: size }} />
      })}
    </div>
  )
}

const StarPicker = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1
        const active = n <= value
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5"
            aria-label={`Set rating to ${n} stars`}
          >
            <FaStar className={active ? 'text-yellowColor' : 'text-[#d7dee8]'} />
          </button>
        )
      })}
    </div>
  )
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const DoctorDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.uid ? getRoleForUser(user.uid) : 'patient'

  const [tab, setTab] = useState('about')
  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [doctorError, setDoctorError] = useState('')

  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [reviewsError, setReviewsError] = useState('')

  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [bookingOpen, setBookingOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [messagesTick, setMessagesTick] = useState(0)

  const localAvailability = useMemo(() => {
    const fallback =
      DEFAULT_AVAILABILITY_BY_ID[id] ||
      DEFAULT_AVAILABILITY_BY_ID[String(id || '').toLowerCase()] ||
      { days: [], times: [] }
    return getDoctorAvailability(id, fallback)
  }, [id])

  const localAvailabilityRows = useMemo(() => {
    if (!localAvailability?.days?.length) return []
    const times = Array.isArray(localAvailability?.times) ? localAvailability.times : []
    const first = times[0]
    const last = times[times.length - 1]
    const range = times.length === 0 ? '' : times.length === 1 ? formatTime(first) : `${formatTime(first)} - ${formatTime(last)}`
    const slotsLabel = times.length ? `${range}${times.length > 1 ? ` (${times.length} slots)` : ''}` : 'Any time'
    return localAvailability.days.map((d) => ({ day: weekdayLong(d), label: slotsLabel }))
  }, [localAvailability])

  const threadMessages = useMemo(() => {
    if (!user?.uid) return []
    return listMessages(id, user.uid)
  }, [id, user?.uid, messagesTick])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoadingDoctor(true)
      setDoctorError('')
      try {
        const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}`)
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to load doctor')
        if (!cancelled) setDoctor(data)
      } catch (e) {
        if (!cancelled) setDoctorError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoadingDoctor(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoadingReviews(true)
      setReviewsError('')
      try {
        const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}/reviews`)
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Failed to load reviews')
        if (!cancelled) setReviews(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setReviewsError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoadingReviews(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const reviewSummary = useMemo(() => {
    const count = reviews.length
    const avg = count === 0 ? 0 : reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count
    return { count, avg: Math.round(avg * 10) / 10 }
  }, [reviews])

  const override = doctorOverridesById[id] || doctorOverridesById[doctor?._id]
  const doctorView = override ? { ...(doctor || {}), ...override } : doctor
  const img = override?.img || doctorImageById[id] || doctorImageById[doctor?._id] || malupitonImg
  const imgFallback = DOCTOR_FALLBACK_BY_ID[id] || DOCTOR_FALLBACK_BY_ID[doctor?._id] || '/images/doctor1.png'

  const submitReview = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (rating < 1 || rating > 5) {
      setSubmitError('Please select a star rating.')
      return
    }
    if (!comment.trim()) {
      setSubmitError('Please write a comment.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(id)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, rating, comment: comment.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to submit review')

      setReviews((prev) => [data, ...prev])
      setName('')
      setRating(0)
      setComment('')
      setTab('feedback')
    } catch (e2) {
      setSubmitError(String(e2?.message || e2))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDoctor && !doctorView) {
    return (
      <section className="py-16">
        <div className="container">
          <p className="text-textColor">Loading doctor...</p>
        </div>
      </section>
    )
  }

  if (doctorError && !doctorView) {
    return (
      <section className="py-16">
        <div className="container">
          <p className="text-red-600">{doctorError}</p>
        </div>
      </section>
    )
  }

  if (!doctor && !doctorView) {
    return (
      <section className="py-16">
        <div className="container">
          <p className="text-textColor">Doctor not found.</p>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="py-14">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="w-[220px] shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-yellowColor/15 to-yellowColor/5">
                  <img
                    src={img}
                    alt={doctorView?.name || 'Doctor'}
                    className="w-full h-full object-contain"
                    onError={applyImgFallback(imgFallback)}
                  />
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-irisBlueColor/10 text-irisBlueColor text-[13px] font-[600]">
                    {doctorView?.specialty}
                  </span>

                  <h1 className="mt-3 text-[28px] font-[800] text-headingColor">{doctorView?.name}</h1>

                  <div className="mt-2 flex items-center gap-3">
                    <Stars value={doctor?.ratingAvg ?? reviewSummary.avg} />
                    <span className="text-textColor text-[14px]">({doctor?.reviewCount ?? reviewSummary.count})</span>
                  </div>

                  <p className="mt-3 text-textColor">Specialization in {doctorView?.specialty}</p>
                </div>
              </div>

              <div className="mt-10 border-b border-[#e7eff7] flex items-center gap-8">
                <button
                  type="button"
                  onClick={() => setTab('about')}
                  className={[
                    'pb-3 text-[14px] font-[700] transition',
                    tab === 'about' ? 'text-headingColor border-b-2 border-primaryColor' : 'text-textColor',
                  ].join(' ')}
                >
                  About
                </button>
                <button
                  type="button"
                  onClick={() => setTab('feedback')}
                  className={[
                    'pb-3 text-[14px] font-[700] transition',
                    tab === 'feedback' ? 'text-headingColor border-b-2 border-primaryColor' : 'text-textColor',
                  ].join(' ')}
                >
                  Feedback
                </button>
              </div>

              {tab === 'about' && (
                <div className="mt-8">
                  <h2 className="text-[18px] font-[800] text-headingColor">
                    About of <span className="text-primaryColor">{doctorView?.name}</span>
                  </h2>
                  <p className="mt-4 text-textColor leading-7">{doctorView?.about}</p>

                  {!!doctorView?.education?.length && (
                    <div className="mt-10">
                      <h3 className="text-[16px] font-[800] text-headingColor">Education</h3>
                      <div className="mt-4 space-y-4">
                        {doctorView.education.map((e, idx) => (
                          <div key={idx} className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-primaryColor text-[14px] font-[700]">{e.years}</p>
                              <p className="text-textColor text-[14px]">{e.degree}</p>
                            </div>
                            <p className="text-textColor text-[13px]">{e.place}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'feedback' && (
                <div className="mt-8">
                  <h2 className="text-[18px] font-[800] text-headingColor">All Reviews ({reviewSummary.count})</h2>

                  {loadingReviews && <p className="mt-4 text-textColor">Loading reviews...</p>}
                  {reviewsError && <p className="mt-4 text-red-600">{reviewsError}</p>}

                  {!loadingReviews && !reviewsError && (
                    <div className="mt-6 space-y-6">
                      {reviews.map((r) => (
                        <div key={r._id} className="flex items-start justify-between gap-6">
                          <div>
                            <p className="text-headingColor font-[800]">{r.name}</p>
                            <p className="text-textColor text-[12px]">{new Date(r.createdAt).toLocaleDateString()}</p>
                            <p className="mt-2 text-textColor">{r.comment}</p>
                          </div>
                          <Stars value={r.rating} className="shrink-0" />
                        </div>
                      ))}

                      {reviews.length === 0 && <p className="text-textColor">No reviews yet.</p>}
                    </div>
                  )}

                  <form onSubmit={submitReview} className="mt-10">
                    <p className="text-headingColor font-[700]">How would you rate the overall experience?*</p>
                    <div className="mt-3">
                      <StarPicker value={rating} onChange={setRating} />
                    </div>

                    <p className="mt-8 text-headingColor font-[700]">Share your feedback or suggestions*</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="h-12 px-4 bg-white border border-[#d9e8f5] rounded-md outline-none focus:border-primaryColor"
                      />
                      <div className="hidden md:block" />
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your message"
                        rows={6}
                        className="md:col-span-2 w-full px-4 py-3 bg-white border border-[#d9e8f5] rounded-md outline-none focus:border-primaryColor"
                      />
                    </div>

                    {submitError && <p className="mt-3 text-red-600">{submitError}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-6 bg-primaryColor text-white px-8 py-3 rounded-md font-[700] hover:bg-sky-700 disabled:opacity-60"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <aside className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.08)_0px_18px_50px_0px] p-7">
              <div className="flex items-center justify-between">
                <p className="text-textColor font-[700]">Ticket Price</p>
                <p className="text-headingColor font-[800]">₱{doctor?.price ?? '—'}</p>
              </div>

              <div className="mt-6">
                <p className="text-headingColor font-[800]">Available Time Slots:</p>
                <div className="mt-3 space-y-2">
                  {(localAvailabilityRows.length ? localAvailabilityRows : (doctor?.timeSlots || []).map((s) => ({
                    day: String(s.day || ''),
                    label: `${s.from} - ${s.to}`,
                  }))).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[13px] text-textColor">
                      <span>{s.day}:</span>
                      <span>{s.label}</span>
                    </div>
                  ))}

                  {!localAvailabilityRows.length && (!doctor?.timeSlots || doctor?.timeSlots.length === 0) && (
                    <p className="text-[13px] text-textColor">No availability set yet.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: location } })
                    return
                  }
                  if (role !== 'patient') {
                    alert('Only patient accounts can book appointments in this demo.')
                    return
                  }
                  setBookingOpen(true)
                }}
                className="mt-8 w-full bg-primaryColor text-white py-3 rounded-md font-[800] hover:bg-sky-700"
              >
                Book Appointment
              </button>

              {role === 'patient' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: location } })
                      return
                    }
                    setMessageOpen(true)
                  }}
                  className="mt-3 w-full border border-[#e7eff7] bg-white text-headingColor py-3 rounded-md font-[800] hover:border-primaryColor transition"
                >
                  Message Doctor
                </button>
              )}
            </aside>
          </div>
        </div>
      </section>

      {messageOpen && (
        <div className="fixed inset-0 z-[220] bg-black/40 overflow-y-auto">
          <div className="min-h-full w-full flex items-start justify-center p-4 md:p-6">
            <div className="w-full max-w-[720px] my-6 rounded-2xl bg-white border border-[#e7eff7] shadow-[rgba(17,12,46,0.20)_0px_40px_120px_0px]">
              <div className="p-6 flex items-start justify-between gap-4 border-b border-[#eef4fb]">
                <div className="min-w-0">
                  <p className="text-headingColor font-[900] text-[18px] truncate">Message</p>
                  <p className="mt-1 text-textColor text-[13px] truncate">
                    {doctorView?.name || doctor?.name || `Doctor ${id}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMessageOpen(false)}
                  className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                <div className="h-[320px] overflow-y-auto rounded-xl border border-[#e7eff7] bg-[#fbfdff] p-4 space-y-3">
                  {threadMessages.length === 0 ? (
                    <p className="text-[13px] text-textColor">No messages yet. Send the first one.</p>
                  ) : (
                    threadMessages.map((m) => (
                      <div
                        key={m.id}
                        className={[
                          'max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-6',
                          m.fromRole === 'patient'
                            ? 'ml-auto bg-primaryColor text-white'
                            : 'mr-auto bg-white border border-[#e7eff7] text-headingColor',
                        ].join(' ')}
                      >
                        <p>{m.text}</p>
                        <p className={['mt-1 text-[11px]', m.fromRole === 'patient' ? 'text-white/80' : 'text-textColor'].join(' ')}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    className="flex-1 h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                    placeholder="Write a message…"
                  />
                  <button
                    type="button"
                    disabled={!messageDraft.trim()}
                    onClick={() => {
                      if (!user?.uid) return
                      const sent = sendMessage({
                        doctorId: id,
                        doctorName: doctorView?.name || doctor?.name || `Doctor ${id}`,
                        patientUid: user.uid,
                        patientName: user.displayName || user.email || 'Patient',
                        fromRole: 'patient',
                        text: messageDraft,
                      })
                      if (sent) {
                        setMessageDraft('')
                        setMessagesTick((t) => t + 1)
                      }
                    }}
                    className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AppointmentBookingModal
        open={bookingOpen}
        doctor={{
          id,
          name: doctorView?.name || doctor?.name || `Doctor ${id}`,
          specialty: doctorView?.specialty || doctor?.specialty || '',
          location: doctorView?.location || doctor?.location || '',
          availableDays: localAvailability?.days || [],
          availableTimes: localAvailability?.times || [],
        }}
        defaultName={user?.displayName || ''}
        onClose={() => setBookingOpen(false)}
        onConfirm={({ patientName, patientAge, patientAddress, paymentMethod, triageLevel, visitType, symptoms, scheduledAt }) => {
          if (!user) return

          createAppointment({
            doctorId: id,
            doctorName: doctorView?.name || doctor?.name || `Doctor ${id}`,
            doctorSpecialty: doctorView?.specialty || doctor?.specialty || '',
            doctorLocation: doctorView?.location || doctor?.location || '',
            amount: doctor?.price || 700,
            patientUid: user.uid,
            patientName,
            patientEmail: user.email || '',
            patientAge,
            patientAddress,
            paymentMethod,
            triageLevel,
            visitType,
            symptoms,
            scheduledAt,
          })

          setBookingOpen(false)
          navigate('/profile')
        }}
      />
    </div>
  )
}

export default DoctorDetails
