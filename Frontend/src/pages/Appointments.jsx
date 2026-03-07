import { useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  getDoctorAppointments,
  getDoctorIdForUser,
  getPatientAppointments,
  getRoleForUser,
  splitPastUpcoming,
  updateAppointment,
} from '../data/appointmentsStore'

const statusMeta = (status) => {
  const s = String(status || 'pending').toLowerCase()
  if (s === 'confirmed') return { label: 'Confirmed', cls: 'bg-irisBlueColor/10 text-irisBlueColor' }
  if (s === 'completed') return { label: 'Completed', cls: 'bg-[#dcfce7] text-[#166534]' }
  if (s === 'canceled') return { label: 'Canceled', cls: 'bg-[#fee2e2] text-[#991b1b]' }
  return { label: 'Pending', cls: 'bg-yellowColor/15 text-yellowColor' }
}

const triageMeta = (triage) => {
  const t = String(triage || 'routine').toLowerCase()
  if (t === 'emergency') return { label: 'Emergency', rank: 0, cls: 'bg-[#fee2e2] text-[#991b1b]' }
  if (t === 'urgent') return { label: 'Urgent', rank: 1, cls: 'bg-yellowColor/15 text-yellowColor' }
  return { label: 'Routine', rank: 2, cls: 'bg-[#e7eff7] text-headingColor' }
}

const formatWhen = (iso) => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return 'Unknown date'
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${date} • ${time}`
}

const toICS = (a) => {
  const dt = new Date(a.scheduledAt)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`

  const uid = `${a.id}@hospital-project`
  const title = `Appointment with ${a.doctorName}`
  const desc = `Visit: ${a.visitType || '-'}\\nSymptoms: ${a.symptoms || '-'}\\nPayment: ${a.paymentMethod || '-'}`
  const loc = a.doctorLocation || ''

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hospital Project//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(dt)}`,
    `DTEND:${fmt(new Date(dt.getTime() + 30 * 60 * 1000))}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
    `LOCATION:${loc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

const RescheduleModal = ({ open, appt, onClose, onSave }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')

  if (!open || !appt) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white border border-[#e7eff7] shadow-[rgba(17,12,46,0.20)_0px_40px_120px_0px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-headingColor font-[900] text-[18px]">Reschedule</p>
            <p className="mt-1 text-textColor text-[13px]">{appt.doctorName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[13px] font-[800] text-headingColor">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
              required
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-[800] text-headingColor">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
              required
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!date || !time) return alert('Pick a date and time.')
            const scheduled = new Date(`${date}T${time}`)
            if (!Number.isFinite(scheduled.getTime())) return alert('Invalid date/time.')
            if (scheduled.getTime() < Date.now()) return alert('Choose a future date/time.')
            onSave(scheduled.toISOString())
          }}
          className="mt-6 w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
        >
          Save
        </button>
      </div>
    </div>
  )
}

const Appointments = () => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const role = getRoleForUser(user.uid)
  const doctorId = role === 'doctor' ? getDoctorIdForUser(user.uid) : ''

  const appts = useMemo(() => {
    if (role === 'doctor') return getDoctorAppointments(doctorId)
    return getPatientAppointments(user.uid)
  }, [role, doctorId, user.uid])

  const { upcoming, past } = useMemo(() => splitPastUpcoming(appts), [appts])
  const [todayOnly, setTodayOnly] = useState(false)

  const [reschedule, setReschedule] = useState(null)

  const downloadICS = (a) => {
    const ics = toICS(a)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appointment-${a.id}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderCard = (a) => {
    const meta = statusMeta(a.status)
    const triage = triageMeta(a.triageLevel)
    const isCanceled = String(a.status || '').toLowerCase() === 'canceled'
    const isCompleted = String(a.status || '').toLowerCase() === 'completed'

    return (
      <div key={a.id} className="rounded-2xl border border-[#e7eff7] bg-white p-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-headingColor font-[900] text-[16px]">{a.doctorName}</p>
            <span className={['inline-flex px-3 py-1 rounded-xl text-[12px] font-[900]', meta.cls].join(' ')}>
              {meta.label}
            </span>
            {role === 'doctor' && (
              <span className={['inline-flex px-3 py-1 rounded-xl text-[12px] font-[900]', triage.cls].join(' ')}>
                {triage.label}
              </span>
            )}
          </div>

          <p className="mt-2 text-[13px] text-textColor">{formatWhen(a.scheduledAt)}</p>
          {!!a.visitType && <p className="mt-1 text-[13px] text-textColor">Visit: <span className="font-[900] text-headingColor">{a.visitType}</span></p>}
          {!!a.symptoms && <p className="mt-1 text-[13px] text-textColor">Symptoms: {a.symptoms}</p>}

          {role === 'doctor' && (
            <p className="mt-2 text-[13px] text-textColor">
              Patient: <span className="font-[900] text-headingColor">{a.patientName || a.patientEmail}</span>
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => downloadICS(a)}
            className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
          >
            Add to Calendar
          </button>

          {!isCanceled && !isCompleted && (
            <button
              type="button"
              onClick={() => setReschedule(a)}
              className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
            >
              Reschedule
            </button>
          )}

          {role === 'patient' && !isCanceled && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm('Cancel this appointment?')
                if (!ok) return
                updateAppointment(a.id, { status: 'canceled' })
                window.location.reload()
              }}
              className="h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
            >
              Cancel
            </button>
          )}

          {role === 'doctor' && !isCanceled && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  updateAppointment(a.id, { status: 'confirmed' })
                  window.location.reload()
                }}
                className="h-10 px-3 rounded-xl bg-irisBlueColor text-white font-[900] hover:opacity-90 transition"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  updateAppointment(a.id, { status: 'completed' })
                  window.location.reload()
                }}
                className="h-10 px-3 rounded-xl bg-[#16a34a] text-white font-[900] hover:opacity-90 transition"
              >
                Complete
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="py-14">
      <div className="container">
        <div className="max-w-[980px] mx-auto">
          <h1 className="text-[30px] font-[900] text-headingColor">
            {role === 'doctor' ? 'Daily Rounds / Schedule' : 'Appointments'}
          </h1>
          <p className="mt-2 text-textColor">
            {role === 'doctor'
              ? 'Queue view with triage and patient summary previews.'
              : 'Your bookings with status and reschedule/cancel options.'}
          </p>

          {role === 'doctor' && (
            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-[#e7eff7] bg-white">
                <input
                  type="checkbox"
                  checked={todayOnly}
                  onChange={(e) => setTodayOnly(e.target.checked)}
                  className="accent-primaryColor"
                />
                <span className="text-[14px] font-[900] text-headingColor">Show only today’s queue</span>
              </label>
              <p className="text-[13px] text-textColor">
                Doctor ID: <span className="font-[900] text-headingColor">{doctorId || 'not set'}</span>
              </p>
            </div>
          )}

          {role === 'doctor' && !doctorId && (
            <div className="mt-6 rounded-2xl border border-[#ffd6d6] bg-[#fff5f5] p-5">
              <p className="font-[900] text-[#b42318]">Set your Doctor ID</p>
              <p className="mt-1 text-[#b42318] text-[13px]">
                Go to <span className="font-[900]">Profile → Settings</span> and set Doctor ID so your schedule can load.
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-8">
            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px]">
              <div className="p-6 border-b border-[#eef4fb]">
                <h2 className="text-[18px] font-[900] text-headingColor">Upcoming</h2>
              </div>
              <div className="p-6">
                {upcoming.length === 0 ? (
                  <p className="text-textColor">No upcoming appointments.</p>
                ) : (
                  <div className="space-y-4">
                    {upcoming
                      .filter((a) => {
                        if (!todayOnly) return true
                        const d = new Date(a.scheduledAt)
                        const now = new Date()
                        return (
                          d.getFullYear() === now.getFullYear() &&
                          d.getMonth() === now.getMonth() &&
                          d.getDate() === now.getDate()
                        )
                      })
                      .slice()
                      .sort((a, b) => {
                        const ta = new Date(a.scheduledAt).getTime()
                        const tb = new Date(b.scheduledAt).getTime()
                        if (ta !== tb) return ta - tb
                        if (role !== 'doctor') return 0
                        return triageMeta(a.triageLevel).rank - triageMeta(b.triageLevel).rank
                      })
                      .map(renderCard)}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px]">
              <div className="p-6 border-b border-[#eef4fb]">
                <h2 className="text-[18px] font-[900] text-headingColor">Past</h2>
              </div>
              <div className="p-6">
                {past.length === 0 ? <p className="text-textColor">No past appointments.</p> : <div className="space-y-4">{past.map(renderCard)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RescheduleModal
        open={Boolean(reschedule)}
        appt={reschedule}
        onClose={() => setReschedule(null)}
        onSave={(scheduledAt) => {
          if (!reschedule) return
          updateAppointment(reschedule.id, { scheduledAt, status: 'pending' })
          setReschedule(null)
          window.location.reload()
        }}
      />
    </section>
  )
}

export default Appointments
