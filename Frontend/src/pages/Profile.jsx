import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../auth/AuthProvider'
import { auth } from '../auth/firebase'
import PayNowButton from '../components/PayNowButton'
import { getProfilePhotoForUser, setProfilePhotoForUser } from '../data/profileStore'
import { getDoctorAvailability, setDoctorAvailability } from '../data/doctorAvailabilityStore'
import { ensureAppointmentReminders } from '../data/notificationsStore'
import { getIncomingReferrals } from '../data/referralsStore'
import { listDoctorThreads, listMessages, listPatientThreads, sendMessage } from '../data/messagesStore'
import { getDoctorDirectoryEntry } from '../data/doctorsDirectory'
import {
  deleteAppointment,
  getDoctorAppointments,
  getDoctorIdForUser,
  getPatientAppointments,
  getRoleForUser,
  setDoctorIdForUser,
  setRoleForUser,
  splitPastUpcoming,
} from '../data/appointmentsStore'

const formatWhen = (iso) => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return 'Unknown date'
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${date} • ${time}`
}

const Section = ({ title, children, right }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px]">
      <div className="p-6 flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-[900] text-headingColor">{title}</h2>
        {right}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  )
}

const EmptyState = ({ title, body, ctaLabel, ctaTo }) => {
  return (
    <div className="rounded-xl border border-dashed border-[#d9e8f5] bg-[#f8fbff] p-6">
      <p className="font-[900] text-headingColor">{title}</p>
      <p className="mt-1 text-textColor">{body}</p>
      {ctaTo && (
        <Link
          to={ctaTo}
          className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}

const AppointmentCard = ({ a, canDelete, onDelete, extra, linkLabel, linkTo }) => {
  return (
    <div className="rounded-xl border border-[#e7eff7] bg-white p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
      <div className="min-w-0">
        <p className="text-headingColor font-[900] truncate">{a.doctorName || `Doctor: ${a.doctorId}`}</p>
        <p className="mt-1 text-[13px] text-textColor">{formatWhen(a.scheduledAt)}</p>
        {!!a.doctorSpecialty && <p className="mt-1 text-[13px] text-textColor">Type: <span className="font-[900] text-headingColor">{a.doctorSpecialty}</span></p>}
        {!!a.doctorLocation && <p className="mt-1 text-[13px] text-textColor">Address: <span className="font-[900] text-headingColor">{a.doctorLocation}</span></p>}
        {!!a.paymentMethod && <p className="mt-1 text-[13px] text-textColor">Payment: <span className="font-[900] text-headingColor">{String(a.paymentMethod).toUpperCase()}</span></p>}
        {extra && <div className="mt-2">{extra}</div>}
        {(linkTo || a?.doctorId) && (
          <div className="mt-3">
            <Link
              to={linkTo || `/doctors/${encodeURIComponent(a.doctorId)}`}
              className="text-[13px] font-[800] text-primaryColor hover:underline"
            >
              {linkLabel || 'View doctor'}
            </Link>
          </div>
        )}
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(a.id)}
          className="shrink-0 h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition self-end sm:self-auto"
        >
          Delete
        </button>
      )}
    </div>
  )
}

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })

const downscaleToSquareDataURL = ({ dataUrl, size = 256, mimeType = 'image/jpeg', quality = 0.9 }) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported.'))

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      const ratio = Math.min(size / img.width, size / img.height)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const x = Math.round((size - w) / 2)
      const y = Math.round((size - h) / 2)
      ctx.drawImage(img, x, y, w, h)

      try {
        resolve(canvas.toDataURL(mimeType, quality))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Invalid image.'))
    img.src = dataUrl
  })

const DEFAULT_DOCTOR_AVAILABILITY = {
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  times: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
}

const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

const formatTime = (hhmm) => {
  const [hStr, mStr] = String(hhmm || '').split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(hhmm || '')
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }).toLowerCase()
}

const Profile = () => {
  const { user, signOutUser, deleteCurrentUser } = useAuth()
  const uid = user?.uid || ''

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoOverride, setPhotoOverride] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [availabilityDays, setAvailabilityDays] = useState(DEFAULT_DOCTOR_AVAILABILITY.days)
  const [availabilityTimes, setAvailabilityTimes] = useState(DEFAULT_DOCTOR_AVAILABILITY.times)
  const [newAvailabilityTime, setNewAvailabilityTime] = useState('09:00')

  const role = getRoleForUser(uid)
  const doctorId = getDoctorIdForUser(uid)
  const doctorEntry = role === 'doctor' && doctorId ? getDoctorDirectoryEntry(doctorId) : null

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [nextRole, setNextRole] = useState(role)
  const [nextDoctorId, setNextDoctorId] = useState(doctorId)

  useEffect(() => {
    if (!uid) return
    setPhotoOverride(getProfilePhotoForUser(uid))
  }, [uid])

  useEffect(() => {
    if (!settingsOpen) return
    if (nextRole !== 'doctor') return
    if (!nextDoctorId) return
    const existing = getDoctorAvailability(nextDoctorId, DEFAULT_DOCTOR_AVAILABILITY)
    setAvailabilityDays(existing.days)
    setAvailabilityTimes(existing.times)
  }, [settingsOpen, nextRole, nextDoctorId])

  const effectiveName = doctorEntry?.name || user?.displayName || user?.email || 'Account'
  const effectivePhotoURL = doctorEntry?.photo || photoOverride || user?.photoURL || ''
  const nextDoctorEntry = nextRole === 'doctor' && nextDoctorId ? getDoctorDirectoryEntry(nextDoctorId) : null
  const settingsEffectivePhotoURL = nextDoctorEntry?.photo || effectivePhotoURL
  const settingsEffectiveName = nextDoctorEntry?.name || displayName

  const appointments = useMemo(() => {
    if (!uid) return []
    if (role === 'doctor') return getDoctorAppointments(doctorId)
    return getPatientAppointments(uid)
  }, [uid, role, doctorId])

  const { upcoming, past } = useMemo(() => splitPastUpcoming(appointments), [appointments])

  useEffect(() => {
    if (role !== 'doctor' || !doctorId) return
    ensureAppointmentReminders({ doctorId, upcomingAppointments: upcoming })
  }, [role, doctorId, upcoming])

  const incomingReferrals = useMemo(() => {
    if (role !== 'doctor' || !doctorId) return []
    return getIncomingReferrals(doctorId)
  }, [role, doctorId])

  const [messagesTick, setMessagesTick] = useState(0)
  const doctorThreads = useMemo(() => {
    if (role !== 'doctor' || !doctorId) return []
    return listDoctorThreads(doctorId)
  }, [role, doctorId, messagesTick])

  const patientThreads = useMemo(() => {
    if (role !== 'patient' || !uid) return []
    return listPatientThreads(uid)
  }, [role, uid, messagesTick])

  const [activeDoctorThreadPatientUid, setActiveDoctorThreadPatientUid] = useState('')
  const [activePatientThreadDoctorId, setActivePatientThreadDoctorId] = useState('')
  const [messageDraft, setMessageDraft] = useState('')

  useEffect(() => {
    if (role !== 'doctor') return
    if (activeDoctorThreadPatientUid) return
    if (doctorThreads[0]?.id) setActiveDoctorThreadPatientUid(doctorThreads[0].id)
  }, [role, activeDoctorThreadPatientUid, doctorThreads])

  useEffect(() => {
    if (role !== 'patient') return
    if (activePatientThreadDoctorId) return
    if (patientThreads[0]?.id) setActivePatientThreadDoctorId(patientThreads[0].id)
  }, [role, activePatientThreadDoctorId, patientThreads])

  const activeThread = useMemo(() => {
    if (role === 'doctor') return doctorThreads.find((t) => t.id === activeDoctorThreadPatientUid) || null
    return patientThreads.find((t) => t.id === activePatientThreadDoctorId) || null
  }, [role, doctorThreads, patientThreads, activeDoctorThreadPatientUid, activePatientThreadDoctorId])

  const threadMessages = useMemo(() => {
    if (role === 'doctor') {
      if (!doctorId || !activeDoctorThreadPatientUid) return []
      return listMessages(doctorId, activeDoctorThreadPatientUid)
    }
    if (!uid || !activePatientThreadDoctorId) return []
    return listMessages(activePatientThreadDoctorId, uid)
  }, [role, doctorId, uid, activeDoctorThreadPatientUid, activePatientThreadDoctorId, messagesTick])

  const deleteAppt = (id) => {
    const ok = window.confirm('Delete this appointment?')
    if (!ok) return
    deleteAppointment(id)
    window.location.reload()
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      setRoleForUser(uid, nextRole)
      if (nextRole === 'doctor') setDoctorIdForUser(uid, nextDoctorId)
      else setDoctorIdForUser(uid, '')

      if (nextRole !== 'doctor' || !nextDoctorEntry) {
        setProfilePhotoForUser(uid, photoOverride)
      } else {
        setProfilePhotoForUser(uid, '')
      }
      if (nextRole === 'doctor' && nextDoctorId) {
        setDoctorAvailability(nextDoctorId, { days: availabilityDays, times: availabilityTimes })
      }

      const trimmedName = displayName.trim()
      const currentName = auth?.currentUser?.displayName || ''

      const profileUpdate = {}
      if ((nextRole !== 'doctor' || !nextDoctorEntry) && trimmedName && trimmedName !== currentName) {
        profileUpdate.displayName = trimmedName
      }

      if (auth?.currentUser && Object.keys(profileUpdate).length > 0) {
        await updateProfile(auth.currentUser, profileUpdate)
      }

      setSettingsOpen(false)
      window.location.reload()
    } catch (err) {
      alert(err?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="py-14">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
              <div className="flex items-center gap-4">
                {effectivePhotoURL ? (
                  <img
                    src={effectivePhotoURL}
                    alt={effectiveName || 'Profile'}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#d9e8f5]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF3FB] border border-[#d9e8f5]" />
                )}
                <div className="min-w-0">
                  <p className="text-headingColor font-[900] text-[18px] truncate">{effectiveName}</p>
                  <p className="text-textColor text-[13px] truncate">{user?.email}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-irisBlueColor/10 text-irisBlueColor text-[13px] font-[900]">
                  Role: {role}
                </span>
                {role === 'doctor' && doctorId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-xl bg-purpleColor/10 text-purpleColor text-[13px] font-[900]">
                    Doctor ID: {doctorId}
                  </span>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="h-12 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                >
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                >
                  Log Out
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(
                      'Delete your account permanently? This cannot be undone.',
                    )
                    if (!ok) return
                    try {
                      await deleteCurrentUser()
                      alert('Account deleted.')
                    } catch (err) {
                      alert(
                        err?.message ||
                          'Failed to delete account. You may need to log in again, then try.',
                      )
                    }
                  }}
                  className="h-12 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
                >
                  Delete Account
                </button>
              </div>

              {settingsOpen && (
                <div className="mt-6 rounded-2xl border border-[#e7eff7] bg-[#fbfdff] p-5">
                  <p className="text-headingColor font-[900]">Profile settings</p>

                  <label className="block mt-4">
                    <span className="text-[13px] font-[800] text-headingColor">Display name</span>
                    <input
                      value={settingsEffectiveName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor disabled:bg-[#f3f6fb]"
                      placeholder="Your name"
                      disabled={nextRole === 'doctor' && !!nextDoctorEntry}
                    />
                    {nextRole === 'doctor' && nextDoctorId && !nextDoctorEntry ? (
                      <p className="mt-2 text-[12px] font-[800] text-[#b42318]">Unknown Doctor ID. Use: ben, alex, lei.</p>
                    ) : null}
                    {nextRole === 'doctor' && nextDoctorEntry ? (
                      <p className="mt-2 text-[12px] text-textColor">Doctor accounts use the selected doctor profile automatically.</p>
                    ) : null}
                  </label>

                  <div className="mt-4">
                    <p className="text-[13px] font-[800] text-headingColor">Profile picture</p>
                    <div className="mt-2 flex items-center gap-3">
                      {settingsEffectivePhotoURL ? (
                        <img
                          src={settingsEffectivePhotoURL}
                          alt="Profile preview"
                          className="w-12 h-12 rounded-xl object-cover border border-[#d9e8f5] bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#EAF3FB] border border-[#d9e8f5]" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            id="profile-photo-file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                setPhotoError('')
                                if (!file.type?.startsWith('image/')) {
                                  throw new Error('Please select an image file.')
                                }
                                const raw = await readFileAsDataURL(file)
                                const resized = await downscaleToSquareDataURL({ dataUrl: raw, size: 256 })
                                setPhotoOverride(resized)
                              } catch (err) {
                                setPhotoError(err?.message || 'Failed to load image.')
                              } finally {
                                e.target.value = ''
                              }
                            }}
                            disabled={nextRole === 'doctor' && !!nextDoctorEntry}
                          />
                          <label
                            htmlFor="profile-photo-file"
                            className={[
                              'h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition inline-flex items-center justify-center',
                              nextRole === 'doctor' && nextDoctorEntry ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
                            ].join(' ')}
                          >
                            Upload
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoError('')
                              setPhotoOverride('')
                            }}
                            disabled={!photoOverride || (nextRole === 'doctor' && !!nextDoctorEntry)}
                            className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="mt-2 text-[12px] text-textColor">
                          {nextRole === 'doctor' && nextDoctorEntry
                            ? 'Doctor accounts use the selected doctor photo automatically.'
                            : 'Upload a photo. It will be resized to 256×256.'}
                        </p>
                        {!!photoError && <p className="mt-2 text-[12px] font-[800] text-[#b42318]">{photoError}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <label className="block">
                      <span className="text-[13px] font-[800] text-headingColor">Role</span>
                      <select
                        value={nextRole}
                        onChange={(e) => setNextRole(e.target.value === 'doctor' ? 'doctor' : 'patient')}
                        className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      >
                        <option value="patient">patient</option>
                        <option value="doctor">doctor</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[13px] font-[800] text-headingColor">Doctor ID (if doctor)</span>
                      <input
                        value={nextDoctorId}
                        onChange={(e) => setNextDoctorId(e.target.value)}
                        className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor disabled:bg-[#f3f6fb]"
                        placeholder="Example: ben"
                        disabled={nextRole !== 'doctor'}
                      />
                      <p className="mt-2 text-[12px] text-textColor">
                        Use the same ID as the URL: <span className="font-[900]">/doctors/&lt;id&gt;</span>
                      </p>
                    </label>
                  </div>

                  {nextRole === 'doctor' && nextDoctorId && (
                    <div className="mt-5 rounded-2xl border border-[#e7eff7] bg-white p-4">
                      <p className="text-[13px] font-[900] text-headingColor">Availability</p>
                      <p className="mt-1 text-[12px] text-textColor">
                        Patients can book only on the days and time slots you select.
                      </p>

                      <div className="mt-3">
                        <p className="text-[12px] font-[800] text-headingColor">Available days</p>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {WEEKDAY_OPTIONS.map((d) => {
                            const checked = availabilityDays.includes(d.value)
                            return (
                              <label
                                key={d.value}
                                className={[
                                  'h-10 rounded-xl border px-3 inline-flex items-center justify-center cursor-pointer select-none text-[13px] font-[900] transition',
                                  checked
                                    ? 'bg-primaryColor text-white border-primaryColor'
                                    : 'bg-white text-headingColor border-[#e7eff7] hover:border-primaryColor',
                                ].join(' ')}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setAvailabilityDays((prev) => {
                                      if (prev.includes(d.value)) return prev.filter((x) => x !== d.value)
                                      return [...prev, d.value]
                                    })
                                  }}
                                  className="hidden"
                                />
                                {d.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-[12px] font-[800] text-headingColor">Available time slots</p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="time"
                            value={newAvailabilityTime}
                            onChange={(e) => setNewAvailabilityTime(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                          />
                          <button
                            type="button"
                            className="h-10 px-4 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                            onClick={() => {
                              const v = (newAvailabilityTime || '').trim()
                              if (!v) return
                              setAvailabilityTimes((prev) => Array.from(new Set([...prev, v])).sort())
                            }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                            onClick={() => {
                              setAvailabilityDays(DEFAULT_DOCTOR_AVAILABILITY.days)
                              setAvailabilityTimes(DEFAULT_DOCTOR_AVAILABILITY.times)
                            }}
                          >
                            Reset
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {availabilityTimes.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-[#e7eff7] bg-[#f8fbff] text-[13px] font-[900] text-headingColor"
                            >
                              {formatTime(t)}
                              <button
                                type="button"
                                className="text-textColor hover:text-[#b42318] transition"
                                onClick={() => setAvailabilityTimes((prev) => prev.filter((x) => x !== t))}
                                aria-label={`Remove ${t}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {availabilityTimes.length === 0 && (
                            <span className="text-[12px] text-textColor">No time slots yet.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveSettings}
                    className="mt-5 w-full h-11 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 disabled:opacity-60 transition"
                  >
                    {saving ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {role === 'doctor' && doctorId && (
              <Section title="Referrals">
                {incomingReferrals.length === 0 ? (
                  <p className="text-textColor text-[14px]">No referrals yet.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingReferrals.map((r) => (
                      <div key={r.id} className="rounded-xl border border-[#e7eff7] bg-white p-5">
                        <p className="font-[900] text-headingColor">
                          Patient: <span className="font-[900]">{r.patientName || r.patientUid}</span>
                        </p>
                        <p className="mt-1 text-[13px] text-textColor">
                          Referred by: <span className="font-[900] text-headingColor">{r.fromDoctorId || 'Doctor'}</span>
                        </p>
                        {!!r.reason && (
                          <p className="mt-2 text-[13px] text-textColor">
                            Reason: <span className="font-[800] text-headingColor">{r.reason}</span>
                          </p>
                        )}
                        <p className="mt-2 text-[12px] text-textColor">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            <Section title="Messages">
              {role === 'doctor' ? (
                !doctorId ? (
                  <p className="text-textColor text-[14px]">Set your Doctor ID in Settings to view messages.</p>
                ) : doctorThreads.length === 0 ? (
                  <p className="text-textColor text-[14px]">No messages yet.</p>
                ) : (
                  <div>
                    <label className="block">
                      <span className="text-[13px] font-[800] text-headingColor">Patient</span>
                      <select
                        value={activeDoctorThreadPatientUid}
                        onChange={(e) => setActiveDoctorThreadPatientUid(e.target.value)}
                        className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      >
                        {doctorThreads.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="mt-4 h-[260px] overflow-y-auto rounded-xl border border-[#e7eff7] bg-[#fbfdff] p-4 space-y-3">
                      {threadMessages.length === 0 ? (
                        <p className="text-[13px] text-textColor">No messages in this thread yet.</p>
                      ) : (
                        threadMessages.map((m) => (
                          <div
                            key={m.id}
                            className={[
                              'max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-6',
                              m.fromRole === 'doctor'
                                ? 'ml-auto bg-primaryColor text-white'
                                : 'mr-auto bg-white border border-[#e7eff7] text-headingColor',
                            ].join(' ')}
                          >
                            <p>{m.text}</p>
                            <p className={['mt-1 text-[11px]', m.fromRole === 'doctor' ? 'text-white/80' : 'text-textColor'].join(' ')}>
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
                        onClick={() => {
                          if (!doctorId || !activeDoctorThreadPatientUid) return
                          const sent = sendMessage({
                            doctorId,
                            doctorName: effectiveName || `Doctor ${doctorId}`,
                            patientUid: activeDoctorThreadPatientUid,
                            patientName: activeThread?.name || '',
                            fromRole: 'doctor',
                            text: messageDraft,
                          })
                          if (sent) {
                            setMessageDraft('')
                            setMessagesTick((t) => t + 1)
                          }
                        }}
                        disabled={!messageDraft.trim()}
                        className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )
              ) : patientThreads.length === 0 ? (
                <p className="text-textColor text-[14px]">No messages yet.</p>
              ) : (
                <div>
                  <label className="block">
                    <span className="text-[13px] font-[800] text-headingColor">Doctor</span>
                    <select
                      value={activePatientThreadDoctorId}
                      onChange={(e) => setActivePatientThreadDoctorId(e.target.value)}
                      className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                    >
                      {patientThreads.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-4 h-[260px] overflow-y-auto rounded-xl border border-[#e7eff7] bg-[#fbfdff] p-4 space-y-3">
                    {threadMessages.length === 0 ? (
                      <p className="text-[13px] text-textColor">No messages in this thread yet.</p>
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
                      onClick={() => {
                        if (!uid || !activePatientThreadDoctorId) return
                        const sent = sendMessage({
                          doctorId: activePatientThreadDoctorId,
                          doctorName: activeThread?.name || `Doctor ${activePatientThreadDoctorId}`,
                          patientUid: uid,
                          patientName: user?.displayName || user?.email || 'Patient',
                          fromRole: 'patient',
                          text: messageDraft,
                        })
                        if (sent) {
                          setMessageDraft('')
                          setMessagesTick((t) => t + 1)
                        }
                      }}
                      disabled={!messageDraft.trim()}
                      className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </Section>

            <Section
              title={role === 'doctor' ? 'Upcoming Appointments' : 'Upcoming Bookings'}
              right={
                role === 'doctor' && !doctorId ? (
                  <span className="text-[12px] font-[900] text-[#b42318]">Set your Doctor ID in Settings</span>
                ) : null
              }
            >
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming items"
                  body={
                    role === 'doctor'
                      ? 'When patients book you, upcoming appointments will show here.'
                      : 'Book a doctor to see upcoming bookings here.'
                  }
                  ctaLabel={role === 'doctor' ? undefined : 'Find a Doctor'}
                  ctaTo={role === 'doctor' ? undefined : '/doctors'}
                />
              ) : (
                <div className="space-y-4">
                  {upcoming.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      a={a}
                      canDelete
                      onDelete={deleteAppt}
                      linkLabel={role === 'doctor' ? 'View patient' : 'View doctor'}
                      linkTo={role === 'doctor' ? `/patients/${encodeURIComponent(a.patientUid)}` : undefined}
                      extra={
                        role === 'doctor' ? (
                          <div className="text-[13px] text-textColor">
                            Patient: <span className="font-[900] text-headingColor">{a.patientName || a.patientEmail}</span>
                            {a.patientAge !== null && a.patientAge !== undefined && a.patientAge !== '' ? (
                              <span className="ml-2">• Age: <span className="font-[900] text-headingColor">{a.patientAge}</span></span>
                            ) : null}
                            {a.patientAddress ? (
                              <div className="mt-1">
                                Address: <span className="font-[900] text-headingColor">{a.patientAddress}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : a?.status !== 'paid' && ['gcash', 'debit', 'credit'].includes(String(a?.paymentMethod || '').toLowerCase()) ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-[13px] text-textColor">
                              Payment: <span className="font-[900] text-headingColor">{String(a.paymentMethod || '').toUpperCase()}</span>
                              <span className="ml-2">•</span> Amount:{' '}
                              <span className="font-[900] text-headingColor">₱{Number(a.amount ?? 700)}</span>
                            </div>
                            <PayNowButton
                              appointmentId={a.id}
                              amount={Number(a.amount ?? 700)}
                              paymentMethodTypes={String(a?.paymentMethod || '').toLowerCase() === 'gcash' ? ['gcash'] : ['card']}
                            />
                          </div>
                        ) : null
                      }
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section title={role === 'doctor' ? 'Past Appointments' : 'Past Bookings'}>
              {past.length === 0 ? (
                <EmptyState
                  title="No past items"
                  body={
                    role === 'doctor'
                      ? 'Past appointments will show here.'
                      : 'After you complete visits, they will show here.'
                  }
                />
              ) : (
                <div className="space-y-4">
                  {past.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      a={a}
                      canDelete
                      onDelete={deleteAppt}
                      linkLabel={role === 'doctor' ? 'View patient' : 'View doctor'}
                      linkTo={role === 'doctor' ? `/patients/${encodeURIComponent(a.patientUid)}` : undefined}
                      extra={
                        role === 'doctor' ? (
                          <div className="text-[13px] text-textColor">
                            Patient: <span className="font-[900] text-headingColor">{a.patientName || a.patientEmail}</span>
                            {a.patientAge !== null && a.patientAge !== undefined && a.patientAge !== '' ? (
                              <span className="ml-2">• Age: <span className="font-[900] text-headingColor">{a.patientAge}</span></span>
                            ) : null}
                            {a.patientAddress ? (
                              <div className="mt-1">
                                Address: <span className="font-[900] text-headingColor">{a.patientAddress}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : null
                      }
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile
