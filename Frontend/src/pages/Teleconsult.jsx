import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getDoctorAppointments, getDoctorIdForUser, getRoleForUser } from '../data/appointmentsStore'
import { addPrescription } from '../data/healthRecordsStore'

const msgKey = (room) => `teleconsult:chat:v1:${room}`

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

const Teleconsult = () => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const role = getRoleForUser(user.uid)
  const doctorId = role === 'doctor' ? getDoctorIdForUser(user.uid) : ''

  const room = useMemo(() => `hospital-project-${user.uid.slice(0, 10)}`, [user.uid])
  const roomUrl = `https://meet.jit.si/${encodeURIComponent(room)}`

  const [checkCam, setCheckCam] = useState(false)
  const [checkMic, setCheckMic] = useState(false)
  const [checkStable, setCheckStable] = useState(false)
  const [permStatus, setPermStatus] = useState('')

  const [messages, setMessages] = useState(() => readJson(msgKey(room), []))
  const [text, setText] = useState('')

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

  const [rxPatientUid, setRxPatientUid] = useState(doctorPatients[0]?.uid || '')
  const [rxDrug, setRxDrug] = useState('')
  const [rxDose, setRxDose] = useState('')
  const [rxNotes, setRxNotes] = useState('')

  useEffect(() => {
    if (role !== 'doctor') return
    if (rxPatientUid) return
    if (doctorPatients[0]?.uid) setRxPatientUid(doctorPatients[0].uid)
  }, [role, rxPatientUid, doctorPatients])

  const send = () => {
    const t = text.trim()
    if (!t) return
    const next = [
      ...messages,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        by: user.displayName || user.email || 'You',
        text: t,
        at: new Date().toISOString(),
      },
    ]
    setMessages(next)
    writeJson(msgKey(room), next)
    setText('')
  }

  return (
    <section className="py-14">
      <div className="container">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[30px] font-[900] text-headingColor">Teleconsult</h1>
              <p className="mt-2 text-textColor">Demo teleconsult using Jitsi (opens a new tab).</p>
            </div>

            <a
              href={roomUrl}
              target="_blank"
              rel="noreferrer"
              className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition inline-flex items-center"
            >
              Join room
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Pre-call checklist</h2>
                <div className="mt-4 space-y-3 text-[14px] text-headingColor font-[800]">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={checkCam} onChange={(e) => setCheckCam(e.target.checked)} className="accent-primaryColor" />
                    Camera ready
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={checkMic} onChange={(e) => setCheckMic(e.target.checked)} className="accent-primaryColor" />
                    Microphone ready
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={checkStable} onChange={(e) => setCheckStable(e.target.checked)} className="accent-primaryColor" />
                    Stable connection
                  </label>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setPermStatus('Requesting permissions...')
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                      stream.getTracks().forEach((t) => t.stop())
                      setPermStatus('Camera/Mic access granted.')
                      setCheckCam(true)
                      setCheckMic(true)
                    } catch (e) {
                      setPermStatus('Camera/Mic permission denied.')
                    }
                  }}
                  className="mt-5 w-full h-11 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                >
                  Test camera & mic
                </button>
                {permStatus && <p className="mt-3 text-[12px] text-textColor">{permStatus}</p>}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                <h2 className="text-[18px] font-[900] text-headingColor">Chat sidebar (demo)</h2>
                <div className="mt-4 h-[320px] overflow-auto rounded-xl border border-[#e7eff7] bg-[#fbfdff] p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-textColor">No messages yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="rounded-xl bg-white border border-[#e7eff7] p-3">
                        <p className="text-[12px] text-textColor">
                          <span className="font-[900] text-headingColor">{m.by}</span> •{' '}
                          {new Date(m.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 text-headingColor">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        send()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={send}
                    className="h-12 px-6 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                  >
                    Send
                  </button>
                </div>

                <p className="mt-3 text-[12px] text-textColor">
                  Room: <span className="font-[900] text-headingColor">{room}</span>
                </p>
              </div>

              {role === 'doctor' && (
                <div className="mt-8 bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
                  <h2 className="text-[18px] font-[900] text-headingColor">Digital prescription</h2>
                  <p className="mt-2 text-textColor text-[13px]">
                    Adds an e-prescription to the patient’s Health Records (demo).
                  </p>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block md:col-span-2">
                      <span className="text-[13px] font-[800] text-headingColor">Patient</span>
                      <select
                        value={rxPatientUid}
                        onChange={(e) => setRxPatientUid(e.target.value)}
                        className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                        disabled={!doctorId || doctorPatients.length === 0}
                      >
                        {doctorPatients.length === 0 ? (
                          <option value="">No patients yet</option>
                        ) : (
                          doctorPatients.map((p) => (
                            <option key={p.uid} value={p.uid}>
                              {p.name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[13px] font-[800] text-headingColor">Medication</span>
                      <input
                        value={rxDrug}
                        onChange={(e) => setRxDrug(e.target.value)}
                        className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
                        placeholder="e.g., Paracetamol"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[13px] font-[800] text-headingColor">Dose</span>
                      <input
                        value={rxDose}
                        onChange={(e) => setRxDose(e.target.value)}
                        className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
                        placeholder="e.g., 500mg every 6h"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-[13px] font-[800] text-headingColor">Notes</span>
                      <textarea
                        value={rxNotes}
                        onChange={(e) => setRxNotes(e.target.value)}
                        rows={3}
                        className="mt-2 w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
                        placeholder="Instructions / duration / warnings"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!doctorId) return alert('Set Doctor ID in Profile → Settings.')
                      if (!rxPatientUid) return alert('Select a patient.')
                      if (!rxDrug.trim() || !rxDose.trim()) return alert('Enter medication and dose.')

                      addPrescription(rxPatientUid, {
                        drug: rxDrug.trim(),
                        dose: rxDose.trim(),
                        notes: rxNotes.trim(),
                        prescribedBy: doctorId,
                        prescribedAt: new Date().toISOString(),
                      })
                      setRxDrug('')
                      setRxDose('')
                      setRxNotes('')
                      alert('Prescription added to patient record (demo).')
                    }}
                    className="mt-5 w-full h-12 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                  >
                    Save prescription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Teleconsult
