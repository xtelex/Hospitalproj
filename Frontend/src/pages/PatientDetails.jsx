import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getDoctorIdForUser, getRoleForUser, listAppointments, splitPastUpcoming } from '../data/appointmentsStore'

const formatWhen = (iso) => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return 'Unknown date'
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${date} • ${time}`
}

const PatientDetails = () => {
  const { uid } = useParams()
  const { user } = useAuth()
  const role = user?.uid ? getRoleForUser(user.uid) : 'patient'
  const doctorId = user?.uid ? getDoctorIdForUser(user.uid) : ''

  if (!user) return <Navigate to="/login" replace />
  if (role !== 'doctor') return <Navigate to="/profile" replace />
  if (!doctorId) return <Navigate to="/profile" replace />

  const { patient, appts, upcoming, past } = useMemo(() => {
    const all = listAppointments().filter((a) => a?.patientUid === uid && a?.doctorId === doctorId)
    const latest = all[0] || null
    const { upcoming: u, past: p } = splitPastUpcoming(all)
    return {
      patient: latest
        ? {
            uid: latest.patientUid,
            name: latest.patientName || '',
            email: latest.patientEmail || '',
            age: latest.patientAge,
            address: latest.patientAddress || '',
          }
        : { uid, name: '', email: '', age: null, address: '' },
      appts: all,
      upcoming: u,
      past: p,
    }
  }, [uid, doctorId])

  return (
    <section className="py-14">
      <div className="container">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-[900] text-headingColor">Patient</h1>
            <p className="mt-1 text-textColor text-[13px]">For doctors only (demo).</p>
          </div>
          <Link
            to="/profile"
            className="h-11 px-5 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition inline-flex items-center"
          >
            Back to Profile
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
              <p className="text-headingColor font-[900] text-[18px]">{patient.name || 'Unknown name'}</p>
              <p className="mt-1 text-textColor text-[13px] break-all">{patient.email || '—'}</p>

              <div className="mt-5 space-y-2 text-[14px] text-textColor">
                <p>
                  Age:{' '}
                  <span className="font-[900] text-headingColor">
                    {patient.age === null || patient.age === undefined || patient.age === '' ? '—' : patient.age}
                  </span>
                </p>
                <p>
                  Address:{' '}
                  <span className="font-[900] text-headingColor">{patient.address || '—'}</span>
                </p>
                <p>
                  Total appointments:{' '}
                  <span className="font-[900] text-headingColor">{appts.length}</span>
                </p>
                <p className="text-[12px] text-textColor">
                  Showing only bookings for <span className="font-[900] text-headingColor">{doctorId}</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {appts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <p className="text-headingColor font-[900] text-[18px]">No appointments found</p>
                <p className="mt-2 text-textColor">
                  This patient has no bookings with your doctor account.
                </p>
              </div>
            ) : null}

            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px]">
              <div className="p-6 border-b border-[#eef4fb]">
                <h2 className="text-[18px] font-[900] text-headingColor">Upcoming appointments</h2>
              </div>
              <div className="p-6">
                {upcoming.length === 0 ? (
                  <p className="text-textColor">No upcoming appointments.</p>
                ) : (
                  <div className="space-y-4">
                    {upcoming.map((a) => (
                      <div key={a.id} className="rounded-xl border border-[#e7eff7] p-5">
                        <p className="text-headingColor font-[900]">{a.doctorName}</p>
                        <p className="mt-1 text-[13px] text-textColor">{formatWhen(a.scheduledAt)}</p>
                        {a.paymentMethod && (
                          <p className="mt-1 text-[13px] text-textColor">
                            Payment: <span className="font-[900] text-headingColor">{String(a.paymentMethod).toUpperCase()}</span>
                          </p>
                        )}
                        <Link
                          to={`/doctors/${encodeURIComponent(a.doctorId)}`}
                          className="mt-3 inline-block text-[13px] font-[800] text-primaryColor hover:underline"
                        >
                          View doctor
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px]">
              <div className="p-6 border-b border-[#eef4fb]">
                <h2 className="text-[18px] font-[900] text-headingColor">Past appointments</h2>
              </div>
              <div className="p-6">
                {past.length === 0 ? (
                  <p className="text-textColor">No past appointments.</p>
                ) : (
                  <div className="space-y-4">
                    {past.map((a) => (
                      <div key={a.id} className="rounded-xl border border-[#e7eff7] p-5">
                        <p className="text-headingColor font-[900]">{a.doctorName}</p>
                        <p className="mt-1 text-[13px] text-textColor">{formatWhen(a.scheduledAt)}</p>
                        <Link
                          to={`/doctors/${encodeURIComponent(a.doctorId)}`}
                          className="mt-3 inline-block text-[13px] font-[800] text-primaryColor hover:underline"
                        >
                          View doctor
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PatientDetails
