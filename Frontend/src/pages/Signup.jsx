import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiCamera, FiChevronDown, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { useAuth } from '../auth/AuthProvider'

const Signup = () => {
  const navigate = useNavigate()
  const { signInWithGoogle, signUpWithEmailPassword } = useAuth()

  const [role, setRole] = useState('patient')
  const [gender, setGender] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  const photoUrl = useMemo(() => {
    if (!photoFile) return ''
    return URL.createObjectURL(photoFile)
  }, [photoFile])

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const onSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwords do not match.')
      return
    }

    try {
      const displayName = `${firstName} ${lastName}`.trim()
      const signedInUser = await signUpWithEmailPassword({ email, password, displayName })
      if (signedInUser?.uid) {
        localStorage.setItem(`role:${signedInUser.uid}`, role)
      }
      navigate('/home', { replace: true })
    } catch (err) {
      alert(err?.message || 'Sign up failed.')
    }
  }

  return (
    <section className="min-h-[calc(100vh-72px)] py-14">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Left: visual */}
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 backdrop-blur p-10 shadow-[rgba(17,12,46,0.08)_0px_40px_120px_0px]">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_650px_at_15%_25%,rgba(151,113,255,0.16)_0%,rgba(151,113,255,0)_60%),radial-gradient(900px_650px_at_85%_30%,rgba(1,181,197,0.12)_0%,rgba(1,181,197,0)_58%),radial-gradient(900px_650px_at_50%_95%,rgba(0,103,255,0.12)_0%,rgba(0,103,255,0)_60%)]" />

            <p className="inline-flex items-center gap-2 text-primaryColor font-[800] text-[18px]">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-primaryColor text-white">+</span>
              MediKill
            </p>

            <h1 className="mt-8 text-[42px] md:text-[52px] leading-[1.05] font-[800] text-headingColor">
              Create your account
            </h1>
            <p className="mt-4 text-[18px] md:text-[20px] text-textColor max-w-[520px]">
              Choose if you&apos;re a doctor or patient, select your gender, then finish your details.
            </p>

            <div className="mt-10 rounded-2xl border border-[#e7eff7] bg-white/70 p-6">
              <p className="text-[14px] font-[800] text-headingColor">Tip</p>
              <p className="mt-1 text-[14px] leading-6 text-textColor">Make sure all the information is correct.</p>
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl border border-[#e7eff7] bg-white/80 backdrop-blur p-8 md:p-10 shadow-[rgba(17,12,46,0.08)_0px_40px_120px_0px]">
            <h2 className="text-[28px] font-[900] text-headingColor">Sign up</h2>
            <p className="text-textColor mt-2">Create an account with Google, or sign up with email/password.</p>

            <div className="mt-6">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const signedInUser = await signInWithGoogle()
                    if (signedInUser?.uid) {
                      localStorage.setItem(`role:${signedInUser.uid}`, role)
                    }
                    navigate('/home', { replace: true })
                  } catch (err) {
                    alert(err?.message || 'Google sign-in failed.')
                  }
                }}
                className="w-full h-12 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
              >
                Continue with Google
              </button>
              <p className="mt-2 text-[12px] text-textColor">Uses your Gmail/Google account (popup).</p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Role + Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">Are you a</span>
                  <div className="relative mt-2">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-12 rounded-xl border border-[#e7eff7] bg-white px-4 pr-10 outline-none focus:border-primaryColor text-[15px]"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-textColor pointer-events-none" />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">Gender</span>
                  <div className="relative mt-2">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-12 rounded-xl border border-[#e7eff7] bg-white px-4 pr-10 outline-none focus:border-primaryColor text-[15px]"
                      required
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-textColor pointer-events-none" />
                  </div>
                </label>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">First name</span>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                    <FiUser className="text-textColor" />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      type="text"
                      autoComplete="given-name"
                      placeholder="Juan"
                      className="w-full outline-none text-[15px] bg-transparent"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">Last name</span>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                    <FiUser className="text-textColor" />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      type="text"
                      autoComplete="family-name"
                      placeholder="Dela Cruz"
                      className="w-full outline-none text-[15px] bg-transparent"
                      required
                    />
                  </div>
                </label>
              </div>

              {/* Email */}
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
                  />
                </div>
              </label>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">Password</span>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                    <FiLock className="text-textColor" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full outline-none text-[15px] bg-transparent"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[14px] font-[700] text-headingColor">Confirm</span>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e7eff7] bg-white px-4 h-12 focus-within:border-primaryColor">
                    <FiLock className="text-textColor" />
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full outline-none text-[15px] bg-transparent"
                      required
                    />
                  </div>
                </label>
              </div>

              {/* Photo */}
              <div className="rounded-xl border border-[#e7eff7] bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#EAF3FB] overflow-hidden grid place-items-center border border-[#d9e8f5] shrink-0">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Selected profile" className="w-full h-full object-cover" />
                    ) : (
                      <FiCamera className="text-[22px] text-textColor" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-[14px] font-[800] text-headingColor">Profile photo</p>
                    <p className="text-[13px] text-textColor mt-0.5">Optional. JPG/PNG up to a few MB.</p>
                  </div>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    />
                    <span className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#e7eff7] bg-white hover:border-primaryColor text-headingColor font-[800] text-[14px] transition">
                      Upload
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-[14px] text-textColor">
              Already have an account?{' '}
              <Link to="/login" className="font-[800] text-primaryColor hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Signup
