import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiLock, FiMail } from 'react-icons/fi'
import { useAuth } from '../auth/AuthProvider'
import patientImg from '../assets/images/patient.jpg'
import { getDoctorDirectoryEntry, listDoctorDirectory } from '../data/doctorsDirectory'
import { setDoctorIdForUser, setRoleForUser } from '../data/appointmentsStore'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendPasswordReset, signInWithEmailPassword, signInWithGoogle } = useAuth()

  const [role, setRole] = useState('patient')
  const [doctorId, setDoctorId] = useState('alex')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const selectedDoctor = role === 'doctor' ? getDoctorDirectoryEntry(doctorId) : null
  const doctorOptions = listDoctorDirectory()
  const roleHeroImg = role === 'doctor' ? selectedDoctor?.photo || patientImg : patientImg
  const roleHeroAlt = role === 'doctor' ? selectedDoctor?.name || 'Doctor' : 'Patient'

  const microcopyVariants = [
    {
      patient: 'Book visits, view lab results, and manage your health records in one secure place.',
      doctor: 'Manage patient schedules, verify licenses, and review medical history securely.',
    },
    {
      patient: 'Schedule appointments fast, check lab results, and keep your medical records organized.',
      doctor: 'Streamline appointments, complete license verification, and access patient records on demand.',
    },
    {
      patient: 'Easily book visits, track lab results, and access your health history anytime.',
      doctor: 'Stay on top of schedules, confirm credentials, and view patient medical history in one dashboard.',
    },
  ]
  const activeMicrocopyVariant = 0
  const cardMicrocopy = microcopyVariants[activeMicrocopyVariant] ?? microcopyVariants[0]

  const onSubmit = async (e) => {
    e.preventDefault()
    if (loggingIn || googleLoading) return
    setLoggingIn(true)
    try {
      if (role === 'doctor' && !selectedDoctor) throw new Error('Please select a doctor.')
      const signedInUser = await signInWithEmailPassword({ email, password })
      if (signedInUser?.uid) {
        setRoleForUser(signedInUser.uid, role)
        if (role === 'doctor') setDoctorIdForUser(signedInUser.uid, doctorId)
        else setDoctorIdForUser(signedInUser.uid, '')
      }
      const target = location.state?.from?.pathname || '/home'
      navigate(target, { replace: true })
    } catch (err) {
      alert(err?.message || 'Login failed.')
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <section className="min-h-[calc(100vh-72px)] py-14">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Left: brand panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur p-10 shadow-[rgba(17,12,46,0.08)_0px_40px_120px_0px]">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_600px_at_20%_25%,rgba(0,103,255,0.14)_0%,rgba(0,103,255,0)_60%),radial-gradient(900px_600px_at_85%_35%,rgba(1,181,197,0.12)_0%,rgba(1,181,197,0)_58%),radial-gradient(900px_600px_at_50%_95%,rgba(254,182,13,0.10)_0%,rgba(254,182,13,0)_60%)]" />

            <p className="inline-flex items-center gap-2 text-primaryColor font-[800] text-[18px]">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-primaryColor text-white">+</span>
              MEDI CARE
            </p>

            <h1 className="mt-8 text-[42px] md:text-[52px] leading-[1.05] font-[800] text-headingColor">
              Welcome back
            </h1>
            <p className="mt-4 text-[18px] md:text-[20px] text-textColor max-w-[520px]">
              Log in as a patient or a doctor.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/50 bg-white/60">
              <img
                src={roleHeroImg}
                alt={roleHeroAlt}
                className={[
                  'w-full h-44 md:h-56 object-cover',
                  role === 'patient' ? 'object-[left_top]' : 'object-[center_28%]',
                ].join(' ')}
              />
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#e7eff7] bg-white/70 p-5">
                <p className="font-[800] text-headingColor">Patient</p>
                <p className="text-textColor mt-1 text-[14px] leading-6">{cardMicrocopy.patient}</p>
              </div>
              <div className="rounded-xl border border-[#e7eff7] bg-white/70 p-5">
                <p className="font-[800] text-headingColor">Doctor</p>
                <p className="text-textColor mt-1 text-[14px] leading-6">{cardMicrocopy.doctor}</p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl border border-[#e7eff7] bg-white/80 backdrop-blur p-8 md:p-10 shadow-[rgba(17,12,46,0.08)_0px_40px_120px_0px]">
            <h2 className="text-[28px] font-[900] text-headingColor">Log in</h2>
            <p className="text-textColor mt-2">Choose your role, then enter your credentials.</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                disabled={loggingIn || googleLoading}
                className={[
                  'h-12 rounded-xl border text-[15px] font-[800] transition',
                  (loggingIn || googleLoading) ? 'opacity-60 cursor-not-allowed' : '',
                  role === 'patient'
                    ? 'bg-primaryColor text-white border-primaryColor shadow-[rgba(0,103,255,0.25)_0px_18px_50px_0px]'
                    : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                ].join(' ')}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                disabled={loggingIn || googleLoading}
                className={[
                  'h-12 rounded-xl border text-[15px] font-[800] transition',
                  (loggingIn || googleLoading) ? 'opacity-60 cursor-not-allowed' : '',
                  role === 'doctor'
                    ? 'bg-primaryColor text-white border-primaryColor shadow-[rgba(0,103,255,0.25)_0px_18px_50px_0px]'
                    : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                ].join(' ')}
              >
                Doctor
              </button>
            </div>

            {role === 'doctor' && (
              <label className="block mt-5">
                <span className="text-[14px] font-[700] text-headingColor">Doctor profile</span>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={loggingIn || googleLoading}
                  className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[12px] text-textColor">Your name and photo will match the selected doctor.</p>
              </label>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[14px] font-[700] text-headingColor">Email</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                  <FiMail className="text-textColor" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="name@email.com"
                    className="w-full outline-none text-[15px] bg-transparent"
                    required
                    disabled={loggingIn || googleLoading}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[14px] font-[700] text-headingColor">Password</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                  <FiLock className="text-textColor" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full outline-none text-[15px] bg-transparent"
                    required
                    disabled={loggingIn || googleLoading}
                  />
                </div>
              </label>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[13px] text-textColor">
                  Logging in as: <span className="font-[800] text-headingColor">{role}</span>
                </p>
                <button
                  type="button"
                  className="text-[13px] font-[700] text-primaryColor hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (resetLoading || loggingIn || googleLoading) return
                    const targetEmail = window.prompt('Enter your email to reset your password:', email || '')
                    if (!targetEmail) return
                    try {
                      setResetLoading(true)
                      await sendPasswordReset({ email: targetEmail })
                      alert('Password reset email sent. Check your inbox/spam.')
                    } catch (err) {
                      alert(err?.message || 'Failed to send reset email.')
                    } finally {
                      setResetLoading(false)
                    }
                  }}
                  disabled={resetLoading || loggingIn || googleLoading}
                >
                  {resetLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loggingIn || googleLoading}
                className="mt-2 w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loggingIn && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                )}
                {loggingIn ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="mt-4">
              <button
                type="button"
                onClick={async () => {
                  if (googleLoading || loggingIn) return
                  try {
                    setGoogleLoading(true)
                    if (role === 'doctor' && !selectedDoctor) throw new Error('Please select a doctor.')
                    const signedInUser = await signInWithGoogle({ role, doctorId })
                    if (signedInUser?.uid) {
                      setRoleForUser(signedInUser.uid, role)
                      if (role === 'doctor') setDoctorIdForUser(signedInUser.uid, doctorId)
                      else setDoctorIdForUser(signedInUser.uid, '')
                    }
                    const target = location.state?.from?.pathname || '/home'
                    navigate(target, { replace: true })
                  } catch (err) {
                    alert(err?.message || 'Google sign-in failed.')
                  } finally {
                    setGoogleLoading(false)
                  }
                }}
                disabled={googleLoading || loggingIn}
                className="w-full h-12 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {googleLoading && (
                  <span className="w-4 h-4 rounded-full border-2 border-[#0b3b88]/40 border-t-transparent animate-spin" />
                )}
                {googleLoading ? 'Opening Google...' : 'Continue with Google'}
              </button>
              <p className="mt-2 text-[12px] text-textColor">
                Uses your Gmail/Google account (popup on desktop, redirect on mobile).
              </p>
            </div>

            <p className="mt-6 text-[14px] text-textColor">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-[800] text-primaryColor hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
