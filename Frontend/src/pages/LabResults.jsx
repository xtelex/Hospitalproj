import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getDoctorAppointments, getDoctorIdForUser, getPatientAppointments, getRoleForUser } from '../data/appointmentsStore'

const keyFor = (patientUid) => `labs:v1:${patientUid}`
const normalizeDoctorKey = (doctorId) => String(doctorId || '').trim()
const noteKeyFor = (patientUid, doctorId) => `labs:note:v1:${patientUid}:${normalizeDoctorKey(doctorId).toLowerCase()}`
const noteKeyForLegacy = (patientUid, doctorId) => `labs:note:v1:${patientUid}:${normalizeDoctorKey(doctorId)}`

const readDoctorNote = (patientUid, doctorId) => {
  if (!patientUid || !doctorId) return ''
  return (
    localStorage.getItem(noteKeyFor(patientUid, doctorId)) ||
    localStorage.getItem(noteKeyForLegacy(patientUid, doctorId)) ||
    ''
  )
}

const writeDoctorNote = (patientUid, doctorId, note) => {
  if (!patientUid || !doctorId) return
  localStorage.setItem(noteKeyFor(patientUid, doctorId), note)
  localStorage.setItem(noteKeyForLegacy(patientUid, doctorId), note)
}

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const sampleLabs = [
  { date: '2026-02-01', name: 'Fasting Blood Sugar', value: 112, unit: 'mg/dL' },
  { date: '2026-02-15', name: 'Fasting Blood Sugar', value: 106, unit: 'mg/dL' },
  { date: '2026-03-01', name: 'Fasting Blood Sugar', value: 98, unit: 'mg/dL' },
  { date: '2026-03-01', name: 'Hemoglobin', value: 12.9, unit: 'g/dL' },
]

const flagFor = (r) => {
  const n = String(r?.name || '').toLowerCase()
  const v = Number(r?.value)
  if (!Number.isFinite(v)) return { abnormal: false, label: '' }
  if (n.includes('sugar')) {
    // Simple demo rules:
    // low <70, very high >=126
    if (v < 70) return { abnormal: true, label: 'LOW' }
    if (v >= 126) return { abnormal: true, label: 'HIGH' }
    return { abnormal: false, label: '' }
  }
  if (n.includes('hemoglobin')) {
    if (v < 12) return { abnormal: true, label: 'LOW' }
    if (v > 17.5) return { abnormal: true, label: 'HIGH' }
    return { abnormal: false, label: '' }
  }
  return { abnormal: false, label: '' }
}

const TrendChart = ({ points }) => {
  const data = Array.isArray(points) ? points : []
  if (data.length === 0) return null

  const values = data.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 10
  const w = 360
  const h = 120
  const dx = (w - pad * 2) / Math.max(1, data.length - 1)
  const scaleY = (v) => {
    if (max === min) return h / 2
    return pad + (h - pad * 2) * (1 - (v - min) / (max - min))
  }

  const pts = data.map((p, i) => `${pad + i * dx},${scaleY(p.value)}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="rounded-xl bg-[#f8fbff] border border-[#e7eff7]">
      <polyline points={pts} fill="none" stroke="#0067FF" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((p, i) => (
        <circle key={i} cx={pad + i * dx} cy={scaleY(p.value)} r="4" fill="#01B5C5" />
      ))}
    </svg>
  )
}

const LabResults = () => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const role = getRoleForUser(user.uid)
  const doctorId = role === 'doctor' ? getDoctorIdForUser(user.uid) : ''

  const patientDoctors = useMemo(() => {
    if (role !== 'patient') return []
    const appts = getPatientAppointments(user.uid)
    const map = new Map()
    const sorted = [...appts].sort((a, b) => {
      const at = new Date(a?.scheduledAt || 0).getTime()
      const bt = new Date(b?.scheduledAt || 0).getTime()
      return bt - at
    })

    for (const a of sorted) {
      if (!a?.doctorId) continue
      if (!map.has(a.doctorId)) {
        map.set(a.doctorId, {
          id: a.doctorId,
          name: a.doctorName || `Doctor ${a.doctorId}`,
          specialty: a.doctorSpecialty || '',
        })
      }
    }

    return Array.from(map.values())
  }, [role, user.uid])

  const doctorPatients = useMemo(() => {
    if (role !== 'doctor' || !doctorId) return []
    const appts = getDoctorAppointments(doctorId)
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
  }, [role, doctorId])

  const [selectedPatientUid, setSelectedPatientUid] = useState(() => {
    if (role !== 'doctor') return user.uid
    return doctorPatients[0]?.uid || ''
  })

  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (role !== 'patient') return ''
    const appts = getPatientAppointments(user.uid)
    const latest = [...appts].sort((a, b) => new Date(b?.scheduledAt || 0) - new Date(a?.scheduledAt || 0))[0]
    return latest?.doctorId || ''
  })

  useEffect(() => {
    if (role !== 'doctor') return
    if (selectedPatientUid) return
    if (doctorPatients[0]?.uid) setSelectedPatientUid(doctorPatients[0].uid)
  }, [role, selectedPatientUid, doctorPatients])

  useEffect(() => {
    if (role !== 'patient') return
    if (selectedDoctorId) return
    if (patientDoctors[0]?.id) setSelectedDoctorId(patientDoctors[0].id)
  }, [role, selectedDoctorId, patientDoctors])

  const effectivePatientUid = role === 'doctor' ? selectedPatientUid : user.uid
  const effectiveDoctorId = role === 'doctor' ? doctorId : selectedDoctorId

  const [note, setNote] = useState('')

  useEffect(() => {
    if (!effectivePatientUid || !effectiveDoctorId) {
      setNote('')
      return
    }
    setNote(readDoctorNote(effectivePatientUid, effectiveDoctorId))
  }, [effectivePatientUid, effectiveDoctorId])

  const labs = useMemo(() => {
    if (!effectivePatientUid) return []
    const saved = readJson(keyFor(effectivePatientUid), null)
    if (saved && Array.isArray(saved) && saved.length) return saved
    return sampleLabs
  }, [effectivePatientUid])

  const setLabs = (next) => {
    if (!effectivePatientUid) return
    writeJson(keyFor(effectivePatientUid), next)
  }

  const sugarTrend = labs.filter((x) => x.name.toLowerCase().includes('sugar'))
  const abnormalCount = labs.filter((r) => flagFor(r).abnormal).length

  return (
    <section className="py-14">
      <div className="container">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[30px] font-[900] text-headingColor">Lab Results</h1>
              <p className="mt-2 text-textColor">
                Demo page. In a real app, these would come from a secure backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(labs, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'lab-results.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
            >
              Download (demo)
            </button>
          </div>

          {role === 'doctor' && (
            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-[900] text-headingColor">Patient:</span>
                <select
                  value={selectedPatientUid}
                  onChange={(e) => {
                    setSelectedPatientUid(e.target.value)
                  }}
                  className="h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                  disabled={!doctorId || doctorPatients.length === 0}
                >
                  {doctorPatients.length === 0 ? (
                    <option value="">No patients</option>
                  ) : (
                    doctorPatients.map((p) => (
                      <option key={p.uid} value={p.uid}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <p className="text-[13px] text-textColor">
                Abnormal flags:{' '}
                <span className="font-[900] text-headingColor">{abnormalCount}</span>
              </p>
            </div>
          )}

          {role === 'patient' && (
            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-[900] text-headingColor">Doctor:</span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                  disabled={patientDoctors.length === 0}
                >
                  {patientDoctors.length === 0 ? (
                    <option value="">No doctors yet</option>
                  ) : (
                    patientDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.specialty ? ` • ${d.specialty}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <p className="text-[13px] text-textColor">
                Abnormal flags:{' '}
                <span className="font-[900] text-headingColor">{abnormalCount}</span>
              </p>
            </div>
          )}

          {role === 'doctor' && !doctorId && (
            <div className="mt-6 rounded-2xl border border-[#ffd6d6] bg-[#fff5f5] p-5">
              <p className="font-[900] text-[#b42318]">Set your Doctor ID</p>
              <p className="mt-1 text-[#b42318] text-[13px]">Go to Profile → Settings, then open Lab Results again.</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Trend tracking</h2>
                <p className="mt-2 text-textColor text-[13px]">Example: fasting blood sugar.</p>
                <div className="mt-4">
                  <TrendChart points={sugarTrend.map((p) => ({ value: p.value }))} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Results</h2>
                <div className="mt-4 space-y-3">
                  {labs.map((r, idx) => (
                    <div
                      key={idx}
                      className={[
                        'rounded-xl border p-4 flex items-center justify-between gap-4',
                        flagFor(r).abnormal ? 'border-[#fecaca] bg-[#fff5f5]' : 'border-[#e7eff7]',
                      ].join(' ')}
                    >
                      <div>
                        <p className="font-[900] text-headingColor">{r.name}</p>
                        <p className="text-[12px] text-textColor">{r.date}</p>
                        {flagFor(r).abnormal && (
                          <span className="inline-flex mt-2 px-2 py-0.5 rounded-lg bg-[#b42318] text-white text-[11px] font-[900]">
                            ABNORMAL {flagFor(r).label}
                          </span>
                        )}
                        {!!r.reviewedAt && (
                          <p className="mt-2 text-[12px] text-textColor">
                            Signed off: <span className="font-[900] text-headingColor">{new Date(r.reviewedAt).toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                      <p className="font-[900] text-headingColor">
                        {r.value} <span className="text-textColor font-[700]">{r.unit}</span>
                      </p>
                      {role === 'doctor' && effectivePatientUid && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = labs.map((x, i) =>
                              i === idx
                                ? { ...x, reviewedBy: doctorId || user.uid, reviewedAt: new Date().toISOString() }
                                : x,
                            )
                            setLabs(next)
                          }}
                          className="shrink-0 h-10 px-4 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                        >
                          Sign-off
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Doctor’s note</h2>
                <p className="mt-2 text-textColor text-[13px]">
                  {role === 'doctor' ? 'Write an explanation for the patient.' : 'Visible to you (demo).'}
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={8}
                  disabled={role !== 'doctor'}
                  className="mt-4 w-full px-4 py-3 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor disabled:bg-[#f3f6fb]"
                  placeholder={role === 'doctor' ? 'Type your note…' : 'No note yet.'}
                />
                {role === 'doctor' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!effectivePatientUid || !effectiveDoctorId) return
                      writeDoctorNote(effectivePatientUid, effectiveDoctorId, note)
                      alert('Saved.')
                    }}
                    className="mt-4 w-full h-11 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                  >
                    Save note
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LabResults
