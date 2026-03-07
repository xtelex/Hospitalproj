import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'
import {
  FiArrowRight,
  FiCalendar,
  FiFileText,
  FiSearch,
  FiShield,
  FiVideo,
} from 'react-icons/fi'

import docBenImg from '../assets/images/docben.png'
import alexImg from '../assets/images/alex.png'
import docLeiImg from '../assets/images/doclei.png'
import { useAuth } from '../auth/AuthProvider.jsx'
import { getRoleForUser } from '../data/appointmentsStore.js'
import ServiceThumbnail from '../components/ServiceThumbnail'
import { SERVICES } from '../data/services'

const applyImgFallback = (fallbackSrc) => (e) => {
  const img = e.currentTarget
  if (!fallbackSrc || img.dataset.fallbackApplied) return
  img.dataset.fallbackApplied = '1'
  img.src = fallbackSrc
}

const GREAT_DOCTORS = [
  { name: 'Dr. Ben', specialty: 'Surgeon', rating: 4.5, img: docBenImg, fallbackImg: '/images/malupiton.png', to: '/doctors/Malupiton' },
  { name: 'Dr. Alex', specialty: 'Neurologist', rating: 5, img: alexImg, fallbackImg: '/images/alden.png', to: '/doctors/alden' },
  { name: 'Dr. Lei', specialty: 'Psychiatrist', rating: 4.8, img: docLeiImg, fallbackImg: '/images/coco.png', to: '/doctors/coco' },
]

const TESTIMONIALS = [
  {
    name: 'Patient',
    img: alexImg,
    fallbackImg: '/images/alden.png',
    text: 'Quick booking and a smooth experience from start to finish.',
  },
  {
    name: 'Patient',
    img: docBenImg,
    fallbackImg: '/images/malupiton.png',
    text: 'The doctor was professional and explained everything clearly.',
  },
  {
    name: 'Patient',
    img: docLeiImg,
    fallbackImg: '/images/coco.png',
    text: 'Appointments and follow-ups were easy to manage in one place.',
  },
]

const Home = () => {
  const { user } = useAuth()
  const role = user?.uid ? getRoleForUser(user.uid) : 'patient'

  const [activeTestimonial, setActiveTestimonial] = useState(1)
  const testimonialRefs = useRef([])
  const testimonialScrollerRef = useRef(null)

  const scrollTestimonialTo = (idx) => {
    const scroller = testimonialScrollerRef.current
    const card = testimonialRefs.current[idx]
    if (!scroller || !card) return

    const left = card.offsetLeft - (scroller.clientWidth - card.clientWidth) / 2
    scroller.scrollTo({ left, behavior: 'smooth' })
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 md:pt-16 pb-14 md:pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_680px_at_15%_25%,rgba(151,113,255,0.22)_0%,rgba(151,113,255,0)_60%),radial-gradient(1000px_680px_at_85%_25%,rgba(1,181,197,0.18)_0%,rgba(1,181,197,0)_60%),radial-gradient(1000px_680px_at_55%_95%,rgba(254,182,13,0.12)_0%,rgba(254,182,13,0)_62%)]" />

        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-[44px] md:text-[64px] leading-[1.05] font-[900] text-headingColor">
                We help patients
                <br />
                live a healthy,
                <br />
                longer life.
              </h1>

              <p className="mt-5 text-[18px] md:text-[20px] text-textColor max-w-[640px] leading-8">
                Find doctors, book visits, and manage your care—built for patients and medical staff.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/doctors"
                  className="inline-flex items-center justify-center bg-primaryColor text-white px-8 py-3.5 rounded-xl text-[16px] font-[900] hover:bg-sky-700 transition"
                >
                  Find a Doctor
                </Link>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-[#e7eff7] bg-white/70 backdrop-blur text-headingColor text-[16px] font-[900] hover:border-primaryColor transition"
                >
                  Book a Visit
                </Link>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="mt-8">
                <div className="flex items-center gap-3 h-12 rounded-2xl border border-[#e7eff7] bg-white/80 backdrop-blur px-4 shadow-sm max-w-[640px]">
                  <FiSearch className="text-textColor" />
                  <input
                    type="text"
                    placeholder="Search doctors, specialties, or clinics"
                    className="w-full outline-none bg-transparent text-[15px]"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-xl bg-primaryColor text-white text-[14px] font-[900] hover:bg-sky-700 transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[680px]">
                {[
                  {
                    title: role === 'doctor' ? 'Daily Rounds' : 'Appointments',
                    icon: FiCalendar,
                    to: '/appointments',
                  },
                  {
                    title: role === 'doctor' ? 'Diagnostic Review' : 'Lab Results',
                    icon: FiFileText,
                    to: '/lab-results',
                  },
                  {
                    title: role === 'doctor' ? 'Virtual Clinic' : 'Teleconsult',
                    icon: FiVideo,
                    to: '/teleconsult',
                  },
                  {
                    title: role === 'doctor' ? 'EMR' : 'Health Records',
                    icon: FiShield,
                    to: '/health-records',
                  },
                ].map((c) => {
                  const Icon = c.icon
                  return (
                    <Link
                      key={c.title}
                      to={c.to}
                      className="rounded-2xl border border-white/60 bg-white/55 backdrop-blur p-3 shadow-[rgba(17,12,46,0.08)_0px_24px_70px_0px] hover:border-primaryColor transition"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#EAF3FB] grid place-items-center text-primaryColor">
                        <Icon className="text-[18px]" />
                      </div>
                      <p className="mt-3 text-[14px] font-[900] text-headingColor">{c.title}</p>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[560px]">
                <div className="absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(65%_80%_at_55%_30%,rgba(0,103,255,0.18)_0%,rgba(0,103,255,0)_60%),radial-gradient(70%_80%_at_40%_75%,rgba(1,181,197,0.16)_0%,rgba(1,181,197,0)_62%),radial-gradient(75%_85%_at_85%_55%,rgba(151,113,255,0.18)_0%,rgba(151,113,255,0)_64%)] blur-2xl" />

                <div className="relative rounded-[44px] overflow-hidden border border-white/60 bg-white/40 backdrop-blur shadow-[rgba(17,12,46,0.12)_0px_40px_120px_0px]">
                  <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_55%)]" />
                  <img
                    src="/images/nurse2.jpg"
                    alt="Hospital staff"
                    className="relative z-10 w-full h-[480px] md:h-[520px] object-cover object-top"
                    onError={applyImgFallback('/images/nurse.png')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our medical services */}
      <section className="relative overflow-hidden py-20 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(950px_650px_at_18%_22%,rgba(151,113,255,0.12)_0%,rgba(151,113,255,0)_62%),radial-gradient(950px_650px_at_86%_28%,rgba(1,181,197,0.10)_0%,rgba(1,181,197,0)_60%),radial-gradient(950px_650px_at_55%_95%,rgba(254,182,13,0.10)_0%,rgba(254,182,13,0)_62%)]" />

        <div className="container">
          <div className="max-w-[720px] mx-auto text-center">
            <h2 className="text-[34px] md:text-[44px] leading-tight font-[900] text-headingColor">
              Our medical services
            </h2>
            <p className="text-textColor mt-4">
              World-class care for everyone. Our health system offers unmatched, expert health care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-16 mt-16 place-items-center">
            {SERVICES.slice(0, 3).map((s) => (
              <div key={s.n} className="relative text-center w-full max-w-[420px]">
                <div className="mx-auto w-fit">
                  <ServiceThumbnail
                    src={s.thumbSrc}
                    tileClass={s.tileClass}
                    type={s.thumb}
                    accent={s.accent}
                    title={s.title}
                  />
                </div>
                <h3 className="mt-4 text-[20px] font-[900] text-headingColor">{s.title}</h3>
                <p className="text-textColor mt-3 leading-7 max-w-[380px] mx-auto">
                  World-class care for everyone. From the lab to the clinic, we're here for you.
                </p>

                <div className="mt-8 flex items-center justify-center gap-10">
                  <Link
                    to="/services"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-textColor/30 hover:border-primaryColor hover:text-primaryColor transition"
                    aria-label={`Open ${s.title}`}
                  >
                    <FiArrowRight className="text-[18px]" />
                  </Link>

                  <div
                    className={[
                      'w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-[800] shadow-sm ring-1 ring-black/5',
                      s.badge,
                    ].join(' ')}
                  >
                    {s.n}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-[#e7eff7] bg-white/70 backdrop-blur text-headingColor text-[16px] font-[900] hover:border-primaryColor transition"
            >
              View all services
            </Link>
          </div>
        </div>
      </section>

      {/* Great doctors */}
      <section className="bg-transparent py-20 md:py-24">
        <div className="container">
          <div className="max-w-[720px] mx-auto text-center">
            <h2 className="text-[34px] md:text-[44px] leading-tight font-[900] text-headingColor">Our great doctors</h2>
            <p className="text-textColor mt-4">
              Expert care across specialties—book a visit in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16">
            {GREAT_DOCTORS.map((d) => (
              <div
                key={d.name}
                className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] overflow-hidden flex flex-col"
              >
                <div className="relative bg-[#f7fbff] aspect-[4/3] overflow-hidden shrink-0">
                  <img src={d.img} alt={d.name} className="w-full h-full object-cover block" onError={applyImgFallback(d.fallbackImg)} />
                </div>
                <div className="p-6 bg-white relative z-10">
                  <p className="text-[18px] font-[900] text-headingColor">{d.name}</p>
                  <p className="mt-1 text-textColor">{d.specialty}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px]">
                      <FaStar className="text-yellowColor" />
                      <span className="text-headingColor font-[900]">{d.rating}</span>
                    </div>
                    <Link
                      to={d.to}
                      className="h-10 px-4 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition inline-flex items-center justify-center"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-transparent py-20 md:py-24">
        <div className="container">
          <div className="max-w-[900px] mx-auto text-center">
            <h2 className="text-[34px] md:text-[44px] leading-tight font-[900] text-headingColor">
              What our patients say
            </h2>
            <p className="text-[18px] md:text-[20px] text-textColor mt-3">
              A smoother experience for both patients and doctors.
            </p>
          </div>

          <div className="mt-14 relative">
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
                        isActive ? 'bg-primaryColor border-primaryColor' : 'bg-white border-[#e7eff7] hover:border-primaryColor',
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
                            <p className={isActive ? 'text-white font-[900] text-[18px]' : 'text-headingColor font-[900] text-[18px]'}>
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
                          “{t.text}”
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
    </>
  )
}

export default Home
