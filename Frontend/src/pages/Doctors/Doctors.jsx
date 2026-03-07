import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useAuth } from '../../auth/AuthProvider.jsx'
import AppointmentBookingModal from '../../components/AppointmentBookingModal.jsx'
import { createAppointment, getDoctorAppointments, getDoctorIdForUser, getRoleForUser } from '../../data/appointmentsStore.js'
import { createReferral } from '../../data/referralsStore.js'

import docBenImg from '../../assets/images/docben.png'
import alexImg from '../../assets/images/alex.png'
import docLeiImg from '../../assets/images/doclei.png'

const applyImgFallback = (fallbackSrc) => (e) => {
  const img = e.currentTarget
  if (!fallbackSrc || img.dataset.fallbackApplied) return
  img.dataset.fallbackApplied = '1'
  img.src = fallbackSrc
}

const doctor1Img = docBenImg
const doctor2Img = alexImg
const doctor3Img = docLeiImg
const DOCTORS = [
  {
    id: 'Malupiton',
    name: 'Dr. Ben',
    specialty: 'Surgeon',
    rating: 4.5,
    reviews: 2,
    location: 'Balatan, Camarines Sur',
    img: doctor1Img,
    fallbackImg: '/images/malupiton.png',
    experienceYears: 15,
    medSchool: 'St. Luke’s College of Medicine',
    availableDays: ['sunday', 'tuesday', 'thursday'],
    title: 'from-yellowColor/15 to-yellowColor/5',
  },
  {
    id: 'alden',
    name: 'Dr. Alex',
    specialty: 'Neurologist',
    rating: 0,
    reviews: 0,
    location: 'Guinayangan',
    img: doctor2Img,
    fallbackImg: '/images/alden.png',
    experienceYears: 8,
    medSchool: 'University of the Philippines',
    availableDays: ['monday', 'wednesday'],
    title: 'from-purpleColor/15 to-purpleColor/5',
  },
  {
    id: 'coco',
    name: 'Dr. Lei',
    specialty: 'Psychiatrist',
    rating: 0,
    reviews: 0,
    location: 'Sariaya',
    img: doctor3Img,
    fallbackImg: '/images/coco.png',
    experienceYears: 10,
    medSchool: 'Ateneo School of Medicine',
    availableDays: ['friday', 'saturday'],
    title: 'from-irisBlueColor/15 to-irisBlueColor/5',
  },
]

const TESTIMONIALS = [
  {
    name: 'Muhibur Rahman',
    img: doctor2Img,
    fallbackImg: '/images/alden.png',
    text: 'I have taken medical services from them. They treat so well and they are providing the best medical services.',
  },
  {
    name: 'Muhibur Rahman',
    img: doctor1Img,
    fallbackImg: '/images/malupiton.png',
    text: 'I have taken medical services from them. They treat so well and they are providing the best medical services.',
  },
  {
    name: 'Muhibur Rahman',
    img: doctor3Img,
    fallbackImg: '/images/coco.png',
    text: 'I have taken medical services from them. They treat so well and they are providing the best medical services.',
  },
]

const Doctors = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.uid ? getRoleForUser(user.uid) : 'patient'
  const myDoctorId = user?.uid ? getDoctorIdForUser(user.uid) : ''

  const [querry, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('all')
  const [onlyToday, setOnlyToday] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(1)
  const testimonialRefs = useRef([])
  const testimonialScrollerRef = useRef(null)
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [referralOpen, setReferralOpen] = useState(false)
  const [referralTo, setReferralTo] = useState(null)
  const [refPatientUid, setRefPatientUid] = useState('')
  const [refReason, setRefReason] = useState('')

  const scrollTestimonialTo = (idx) => {
    const scroller = testimonialScrollerRef.current
    const card = testimonialRefs.current[idx]
    if (!scroller || !card) return

    const left = card.offsetLeft - (scroller.clientWidth - card.clientWidth) / 2
    scroller.scrollTo({ left, behavior: 'smooth' })
  }

  const fltered = useMemo(() => {
    const q = querry.trim().toLowerCase()
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    return DOCTORS.filter((d) => {
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)

      const matchesSpecialty = specialty === 'all' || d.specialty.toLowerCase() === specialty
      const matchesToday = !onlyToday || (d.availableDays || []).includes(today)

      return matchesQuery && matchesSpecialty && matchesToday
    })
  }, [querry, specialty, onlyToday])

  const specialtyOptions = useMemo(() => {
    const s = new Set(DOCTORS.map((d) => d.specialty.toLowerCase()))
    return ['all', ...Array.from(s).sort()]
  }, [])

  const myPatients = useMemo(() => {
    if (!user?.uid || !myDoctorId) return []
    const appts = getDoctorAppointments(myDoctorId)
    const map = new Map()
    for (const a of appts) {
      if (!a?.patientUid) continue
      if (!map.has(a.patientUid)) {
        map.set(a.patientUid, {
          uid: a.patientUid,
          name: a.patientName || a.patientEmail || a.patientUid,
          email: a.patientEmail || '',
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [user?.uid, myDoctorId])

  return (
    <div className="min-h-screen">
      <section className="bg-[#FFF6DE] border-[#f1ebf] py-10">
        <div className="container">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-4">
              <h1 className="text-[22px] md:text-[26px] font-[900] text-headingColor">
                {role === 'doctor' ? 'Doctor Directory & Referrals' : 'Find a Doctor'}
              </h1>
              <p className="text-textColor text-[13px] mt-1">
                {role === 'doctor'
                  ? 'Search colleagues and refer patients quickly.'
                  : 'Search doctors by name, specialty, or location.'}
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex items-center justify-center">
              <input
                value={querry}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by doctor name or specialization"
                className="w-full h-12 px-4 bg-white/70 border border-[#d9e8f5] rounded-l-md outline-none focus:bg-white focus:border-primaryColor"
              />
              <button
                type="submit"
                className="h-12 px-8 rounded-r-md bg-primaryColor text-white font-[600] hover:bg-sky-700"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-[#d9e8f5] bg-white/70 outline-none focus:bg-white focus:border-primaryColor text-[14px]"
                  aria-label="Filter by specialty"
                >
                  {specialtyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'all' ? 'All specialties' : opt}
                    </option>
                  ))}
                </select>

                <label className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-[#d9e8f5] bg-white/70">
                  <input
                    type="checkbox"
                    checked={onlyToday}
                    onChange={(e) => setOnlyToday(e.target.checked)}
                    className="accent-primaryColor"
                  />
                  <span className="text-[14px] font-[700] text-headingColor">Only available today</span>
                </label>
              </div>

              <p className="text-[13px] text-textColor">
                Showing <span className="font-[900] text-headingColor">{fltered.length}</span> result(s)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {fltered.map((d) => (
              <div
                key={d.id}
                className="group bg-white rounded-2xl border border-[#e7eff7] hover:border-primaryColor shadow-[rgba(17,12,46,0.08)_0px_18px_50px_0px]"
              >
                <div className="p-6">
                  <div
                    className={[
                      'rounded-2xl overflow-hidden',
                      'bg-gradient-to-br',
                      d.title,
                      'aspect-[4/3] flex items-end justify-center',
                    ].join(' ')}
                  >
                    <img
                      src={d.img}
                      alt={d.name}
                      className="w-[82%] h-[92%] object-contain drop-shadow"
                      onError={applyImgFallback(d.fallbackImg)}
                    />
                  </div>

                  <h3 className="mt-6 text-[22px] font-[700] text-headingColor">{d.name}</h3>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-irisBlueColor/10 text-irisBlueColor text-[13px] font-[600]">
                      {d.specialty}
                    </span>

                    <div className="flex items-center gap-2 text-[14px]">
                      <FaStar className="text-yellowColor" />
                      <span className="text-headingColor font-[700]">{d.rating}</span>
                      <span className="text-textColor">({d.reviews})</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <div className="rounded-xl border border-[#e7eff7] bg-white/70 px-3 py-2">
                      <p className="text-textColor">Experience</p>
                      <p className="font-[900] text-headingColor">{d.experienceYears}+ yrs</p>
                    </div>
                    <div className="rounded-xl border border-[#e7eff7] bg-white/70 px-3 py-2">
                      <p className="text-textColor">Medical school</p>
                      <p className="font-[900] text-headingColor truncate" title={d.medSchool}>
                        {d.medSchool}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <p className="text-textColor text-[14px]">{d.location}</p>

                    <Link
                      to={`/doctors/${d.id}`}
                      aria-label={`View ${d.name}`}
                      className="shrink-0 w-10 h-10 rounded-full border border-[#cfdceb] grid place-items-center text-headingColor hover:border-primaryColor hover:text-primaryColor transition"
                    >
                      <FiArrowUpRight className="text-[18px]" />
                    </Link>
                  </div>

                  {role === 'doctor' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          navigate('/login', { state: { from: location } })
                          return
                        }
                        if (!myDoctorId) {
                          alert('Set your Doctor ID in Profile → Settings first.')
                          return
                        }
                        setReferralTo(d)
                        setReferralOpen(true)
                      }}
                      className="mt-6 w-full h-11 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                    >
                      Refer Patient
                    </button>
                  ) : (
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
                        setBookingDoctor(d)
                        setBookingOpen(true)
                      }}
                      className="mt-6 w-full h-11 rounded-xl bg-primaryColor text-white font-[800] hover:bg-sky-700 transition"
                    >
                      Book Appointment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {fltered.length === 0 && (
            <p className="text-center text-textColor mt-10">No doctors found for &ldquo;{querry}&rdquo;.</p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-[900px] mx-auto text-center">
            <h2 className="text-[42px] md:text-[56px] font-[800] text-headingColor">What our patient say</h2>
            <p className="text-[18px] md:text-[20px] text-textColor mt-3">
              World-class care for everyone. Our health system offers unmatched, expert health care.
            </p>
          </div>

          <div className="mt-14 relative">
            <button
              type="button"
              aria-label="Scroll testimonials left"
              onClick={() => {
                const prev = Math.max(0, activeTestimonial - 1)
                setActiveTestimonial(prev)
                scrollTestimonialTo(prev)
              }}
              className="hidden md:grid absolute -left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#e7eff7] shadow-sm place-items-center hover:border-primaryColor hover:text-primaryColor transition z-10"
            >
              <FiChevronLeft className="text-[18px]" />
            </button>

            <button
              type="button"
              aria-label="Scroll testimonials right"
              onClick={() => {
                const max = Math.max(0, testimonialRefs.current.length - 1)
                const next = Math.min(max, activeTestimonial + 1)
                setActiveTestimonial(next)
                scrollTestimonialTo(next)
              }}
              className="hidden md:grid absolute -right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#e7eff7] shadow-sm place-items-center hover:border-primaryColor hover:text-primaryColor transition z-10"
            >
              <FiChevronRight className="text-[18px]" />
            </button>

            <div ref={testimonialScrollerRef} className="overflow-x-auto no-scrollbar overscroll-x-contain px-2">
              <div className="flex items-stretch gap-8 snap-x snap-mandatory w-max mx-auto pb-4">
                {TESTIMONIALS.map((t, idx) => {
                  const isActive = idx === activeTestimonial
                  return (
                    <div
                      key={idx}
                      ref={(el) => {
                        testimonialRefs.current[idx] = el
                      }}
                      onClick={() => {
                        setActiveTestimonial(idx)
                        scrollTestimonialTo(idx)
                      }}
                      className={[
                        'w-[360px] shrink-0 rounded-xl border transition-all duration-200 cursor-pointer snap-center',
                        'hover:-translate-y-1 hover:shadow-[rgba(17,12,46,0.12)_0px_18px_50px_0px]',
                        isActive
                          ? 'bg-primaryColor border-primaryColor shadow-[rgba(0,103,255,0.35)_0px_25px_60px_0px]'
                          : 'bg-white border-[#e7eff7] hover:border-primaryColor',
                      ].join(' ')}
                    >
                      <div className="p-7">
                        <div className="flex items-center gap-4">
                          <img
                            src={t.img}
                            alt={t.name}
                            className="w-12 h-12 rounded-xl object-cover bg-[#EAF3FB]"
                            onError={applyImgFallback(t.fallbackImg)}
                          />
                          <div className="leading-tight text-left">
                            <p className={isActive ? 'text-white font-[800] text-[18px]' : 'text-headingColor font-[800] text-[18px]'}>
                              {t.name}
                                    </p>
                                                              <div className="flex items-center gap-1 text-yellowColor text-[12px]">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <FaStar key={i} />
                                    ))}
                                  </div>
                                  </div>
                        </div>

                        <p className={['mt-5 leading-8 text-[18px]', isActive ? 'text-white/95' : 'text-textColor'].join(' ')}>
                          &ldquo;{t.text}&rdquo;
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to testimonial ${idx + 1}`}
                  onClick={() => {
                    setActiveTestimonial(idx)
                    scrollTestimonialTo(idx)
                  }}
                  className={[
                    'w-3 h-3 rounded-full border transition',
                    idx === activeTestimonial ? 'bg-primaryColor border-primaryColor' : 'bg-white border-[#cfdceb]',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppointmentBookingModal
        open={bookingOpen}
        doctor={bookingDoctor}
        defaultName={user?.displayName || ''}
        onClose={() => setBookingOpen(false)}
        onConfirm={({ patientName, patientAge, patientAddress, paymentMethod, triageLevel, visitType, symptoms, scheduledAt }) => {
          if (!user || !bookingDoctor) return

          createAppointment({
            doctorId: bookingDoctor.id,
            doctorName: bookingDoctor.name,
            doctorSpecialty: bookingDoctor.specialty,
            doctorLocation: bookingDoctor.location,
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

      {referralOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-[720px] rounded-2xl bg-white border border-[#e7eff7] shadow-[rgba(17,12,46,0.20)_0px_40px_120px_0px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-headingColor font-[900] text-[18px] truncate">Refer patient</p>
                <p className="mt-1 text-textColor text-[13px] truncate">
                  To: <span className="font-[900] text-headingColor">{referralTo?.name}</span> • {referralTo?.specialty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReferralOpen(false)
                  setRefReason('')
                  setRefPatientUid('')
                }}
                className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
              >
                Close
              </button>
            </div>

            {myPatients.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-[#d9e8f5] bg-[#f8fbff] p-6">
                <p className="font-[900] text-headingColor">No patients to refer yet</p>
                <p className="mt-1 text-textColor">You need at least one booking with your doctor account.</p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[13px] font-[800] text-headingColor">Patient</span>
                  <select
                    value={refPatientUid}
                    onChange={(e) => setRefPatientUid(e.target.value)}
                    className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                  >
                    <option value="" disabled>
                      Select patient
                    </option>
                    {myPatients.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="hidden md:block" />

                <label className="block md:col-span-2">
                  <span className="text-[13px] font-[800] text-headingColor">Referral reason</span>
                  <textarea
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    rows={4}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                    placeholder="Brief clinical summary / reason for referral."
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!referralTo) return
                    if (!myDoctorId) return
                    if (!refPatientUid) return alert('Select a patient.')
                    if (!refReason.trim()) return alert('Enter a referral reason.')

                    const patient = myPatients.find((p) => p.uid === refPatientUid)
                    createReferral({
                      fromDoctorId: myDoctorId,
                      toDoctorId: referralTo.id,
                      patientUid: refPatientUid,
                      patientName: patient?.name || '',
                      reason: refReason.trim(),
                    })
                    alert('Referral sent (demo).')
                    setReferralOpen(false)
                    setRefReason('')
                    setRefPatientUid('')
                  }}
                  className="md:col-span-2 mt-2 w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                >
                  Send referral
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctors
