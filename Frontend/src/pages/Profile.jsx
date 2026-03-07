import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { useAuth } from '../auth/AuthProvider'
import { auth } from '../auth/firebase'
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
    <div className="rounded-xl border border-[#e7eff7] bg-white p-5 flex items-start justify-between gap-6">
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
          className="shrink-0 h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
        >
          Delete
        </button>
      )}
    </div>
  )
}

const Profile = () => {
  const { user, signOutUser, deleteCurrentUser } = useAuth()
  const uid = user?.uid || ''

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const role = getRoleForUser(uid)
  const doctorId = getDoctorIdForUser(uid)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [nextRole, setNextRole] = useState(role)
  const [nextDoctorId, setNextDoctorId] = useState(doctorId)

  const appointments = useMemo(() => {
    if (!uid) return []
    if (role === 'doctor') return getDoctorAppointments(doctorId)
    return getPatientAppointments(uid)
  }, [uid, role, doctorId])

  const { upcoming, past } = useMemo(() => splitPastUpcoming(appointments), [appointments])

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

      const trimmedName = displayName.trim()
      if (auth?.currentUser && trimmedName && trimmedName !== (auth.currentUser.displayName || '')) {
        await updateProfile(auth.currentUser, { displayName: trimmedName })
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
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#d9e8f5]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF3FB] border border-[#d9e8f5]" />
                )}
                <div className="min-w-0">
                  <p className="text-headingColor font-[900] text-[18px] truncate">{user?.displayName || 'Account'}</p>
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
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-2 w-full h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                      placeholder="Your name"
                    />
                  </label>

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
                        placeholder="Example: Malupiton"
                        disabled={nextRole !== 'doctor'}
                      />
                      <p className="mt-2 text-[12px] text-textColor">
                        Use the same ID as the URL: <span className="font-[900]">/doctors/&lt;id&gt;</span>
                      </p>
                    </label>
                  </div>

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
