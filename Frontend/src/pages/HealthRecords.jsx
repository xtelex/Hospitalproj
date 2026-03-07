import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getDoctorAppointments, getDoctorIdForUser, getRoleForUser } from '../data/appointmentsStore'
import { addPrescription, addSoapNote, getHealthRecords, saveHealthRecords } from '../data/healthRecordsStore'

const HealthRecords = () => {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  const role = getRoleForUser(user.uid)
  const doctorId = role === 'doctor' ? getDoctorIdForUser(user.uid) : ''

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

  const [selectedPatientUid, setSelectedPatientUid] = useState(doctorPatients[0]?.uid || '')
  useEffect(() => {
    if (role !== 'doctor') return
    if (selectedPatientUid) return
    if (doctorPatients[0]?.uid) setSelectedPatientUid(doctorPatients[0].uid)
  }, [role, selectedPatientUid, doctorPatients])

  const viewingUid = role === 'doctor' ? selectedPatientUid : user.uid

  const [tab, setTab] = useState('soap')
  const [records, setRecords] = useState(() => getHealthRecords(viewingUid))

  useEffect(() => {
    setRecords(getHealthRecords(viewingUid))
  }, [viewingUid])

  const editablePatientFields = role === 'patient'

  const allergyAlert = useMemo(() => (records.allergies || []).join(', '), [records.allergies])

  const tabs = [
    { id: 'soap', label: 'SOAP Notes' },
    { id: 'labs', label: 'Diagnostics' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'vaccinations', label: 'Vaccinations' },
    { id: 'allergies', label: 'Allergies' },
  ]

  return (
    <section className="py-14">
      <div className="container">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-[30px] font-[900] text-headingColor">
                {role === 'doctor' ? 'EMR (Electronic Medical Record)' : 'Health Records'}
              </h1>
              <p className="mt-2 text-textColor">
                {role === 'doctor'
                  ? 'Clinical view (demo). Write SOAP notes and prescriptions for a selected patient.'
                  : 'Your personal medical history (demo, stored locally).'}
              </p>
            </div>

            {role === 'doctor' && (
              <div className="min-w-[280px]">
                <p className="text-[13px] font-[900] text-headingColor">Patient</p>
                <select
                  value={selectedPatientUid}
                  onChange={(e) => setSelectedPatientUid(e.target.value)}
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
                {!doctorId && (
                  <p className="mt-2 text-[12px] text-[#b42318]">
                    Set your Doctor ID in Profile → Settings.
                  </p>
                )}
              </div>
            )}
          </div>

          {allergyAlert && (
            <div className="mt-6 rounded-2xl border border-[#ffd6d6] bg-[#fff5f5] p-5">
              <p className="font-[900] text-[#b42318]">Allergy alert</p>
              <p className="mt-1 text-[#b42318]">{allergyAlert}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  'h-11 px-5 rounded-xl border font-[900] transition',
                  tab === t.id
                    ? 'bg-primaryColor text-white border-primaryColor'
                    : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-[#e7eff7] shadow-[rgba(17,12,46,0.06)_0px_18px_50px_0px] p-7">
            {tab === 'soap' && (
              <SoapNotes
                role={role}
                doctorId={doctorId}
                patientUid={viewingUid}
                notes={records.soapNotes || []}
                onAdd={(note) => {
                  if (!viewingUid) return
                  addSoapNote(viewingUid, note)
                  setRecords(getHealthRecords(viewingUid))
                }}
              />
            )}

            {tab === 'labs' && (
              <div>
                <h2 className="text-[18px] font-[900] text-headingColor">Diagnostics</h2>
                <p className="mt-2 text-textColor">
                  Open the Lab Results page for abnormal flags and sign-off.
                </p>
              </div>
            )}

            {tab === 'prescriptions' && (
              <Prescriptions
                role={role}
                doctorId={doctorId}
                patientUid={viewingUid}
                items={records.prescriptions || []}
                editable={role === 'doctor'}
                onAdd={(rx) => {
                  if (!viewingUid) return
                  addPrescription(viewingUid, rx)
                  setRecords(getHealthRecords(viewingUid))
                }}
                onRemove={(id) => {
                  if (!editablePatientFields) return
                  const next = { ...records, prescriptions: (records.prescriptions || []).filter((x) => x.id !== id) }
                  saveHealthRecords(viewingUid, next)
                  setRecords(next)
                }}
              />
            )}

            {tab === 'vaccinations' && (
              <Vaccinations
                items={records.vaccinations || []}
                editable={editablePatientFields}
                onChange={(items) => {
                  const next = { ...records, vaccinations: items }
                  saveHealthRecords(viewingUid, next)
                  setRecords(next)
                }}
              />
            )}

            {tab === 'allergies' && (
              <Allergies
                items={records.allergies || []}
                editable={editablePatientFields}
                onChange={(items) => {
                  const next = { ...records, allergies: items }
                  saveHealthRecords(viewingUid, next)
                  setRecords(next)
                }}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const Vaccinations = ({ items, editable, onChange }) => {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  return (
    <div>
      <h2 className="text-[18px] font-[900] text-headingColor">Vaccination Records</h2>

      {editable && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vaccine name (e.g., Tetanus)"
              className="h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            />
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const n = name.trim()
              if (!n || !date) return alert('Enter vaccine name and date.')
              onChange([{ id: `${Date.now()}`, name: n, date }, ...items])
              setName('')
              setDate('')
            }}
            className="mt-4 h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
          >
            Add record
          </button>
        </>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-textColor">No vaccination records yet.</p>
        ) : (
          items.map((v) => (
            <div key={v.id} className="rounded-xl border border-[#e7eff7] p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-[900] text-headingColor">{v.name}</p>
                <p className="text-[12px] text-textColor">{v.date}</p>
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((x) => x.id !== v.id))}
                  className="h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const Prescriptions = ({ role, doctorId, patientUid, items, editable, onAdd, onRemove }) => {
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div>
      <h2 className="text-[18px] font-[900] text-headingColor">Prescription History</h2>
      <p className="mt-2 text-textColor text-[13px]">
        {role === 'doctor' ? 'Write an e-prescription for the selected patient.' : 'Your medications.'}
      </p>

      {editable && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              placeholder="Medication (e.g., Amoxicillin)"
              className="h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            />
            <input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="Dose (e.g., 500mg 3x/day)"
              className="h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="md:col-span-2 w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
              placeholder="Notes / instructions"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const d = drug.trim()
              const ds = dose.trim()
              if (!patientUid) return alert('Select a patient.')
              if (!d || !ds) return alert('Enter medication and dose.')
              onAdd({
                drug: d,
                dose: ds,
                notes: notes.trim(),
                prescribedBy: doctorId || 'doctor',
                prescribedAt: new Date().toISOString(),
              })
              setDrug('')
              setDose('')
              setNotes('')
            }}
            className="mt-4 h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
          >
            Add prescription
          </button>
        </>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-textColor">No prescriptions yet.</p>
        ) : (
          items.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#e7eff7] p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-[900] text-headingColor">{p.drug}</p>
                <p className="text-[12px] text-textColor">{p.dose}</p>
                {!!p.notes && <p className="mt-2 text-[13px] text-textColor">{p.notes}</p>}
                {!!p.prescribedAt && (
                  <p className="mt-2 text-[12px] text-textColor">
                    Prescribed: {new Date(p.prescribedAt).toLocaleString()} • by {p.prescribedBy || '—'}
                  </p>
                )}
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const Allergies = ({ items, editable, onChange }) => {
  const [name, setName] = useState('')

  return (
    <div>
      <h2 className="text-[18px] font-[900] text-headingColor">Allergy Alerts</h2>
      <p className="mt-2 text-textColor">Known allergies should be prominent for safety.</p>

      {editable && (
        <div className="mt-4 flex items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Allergy (e.g., Penicillin)"
            className="flex-1 h-12 px-4 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
          />
          <button
            type="button"
            onClick={() => {
              const n = name.trim()
              if (!n) return
              onChange([n, ...items.filter((x) => x.toLowerCase() !== n.toLowerCase())])
              setName('')
            }}
            className="h-12 px-6 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
          >
            Add
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <p className="text-textColor">No allergies listed.</p>
        ) : (
          items.map((a) => (
            <div key={a} className="rounded-xl border border-[#e7eff7] p-4 flex items-center justify-between gap-4">
              <p className="font-[900] text-headingColor">{a}</p>
              {editable && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((x) => x !== a))}
                  className="h-10 px-4 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] text-[#b42318] font-[900] hover:bg-[#ffe9e9] transition"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const SoapNotes = ({ role, doctorId, patientUid, notes, onAdd }) => {
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  return (
    <div>
      <h2 className="text-[18px] font-[900] text-headingColor">SOAP Notes</h2>
      <p className="mt-2 text-textColor text-[13px]">
        Subjective, Objective, Assessment, Plan — standard clinical progress notes.
      </p>

      {role === 'doctor' && (
        <div className="mt-5 grid grid-cols-1 gap-4">
          <textarea
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            placeholder="Subjective: what the patient reports."
          />
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            placeholder="Objective: vitals, exam findings."
          />
          <textarea
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            placeholder="Assessment: diagnosis / impression."
          />
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#e7eff7] outline-none focus:border-primaryColor"
            placeholder="Plan: treatment, follow-up, meds."
          />

          <button
            type="button"
            onClick={() => {
              if (!patientUid) return alert('Select a patient.')
              if (!subjective.trim() && !objective.trim() && !assessment.trim() && !plan.trim()) {
                return alert('Write at least one section.')
              }
              onAdd({
                subjective: subjective.trim(),
                objective: objective.trim(),
                assessment: assessment.trim(),
                plan: plan.trim(),
                authorDoctorId: doctorId || 'doctor',
                createdAt: new Date().toISOString(),
              })
              setSubjective('')
              setObjective('')
              setAssessment('')
              setPlan('')
            }}
            className="h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
          >
            Add SOAP note
          </button>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {notes.length === 0 ? (
          <p className="text-textColor">No notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-2xl border border-[#e7eff7] bg-[#fbfdff] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="font-[900] text-headingColor">SOAP Note</p>
                <p className="text-[12px] text-textColor">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''} • {n.authorDoctorId || '—'}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-[13px] text-textColor">
                {!!n.subjective && (
                  <p>
                    <span className="font-[900] text-headingColor">S:</span> {n.subjective}
                  </p>
                )}
                {!!n.objective && (
                  <p>
                    <span className="font-[900] text-headingColor">O:</span> {n.objective}
                  </p>
                )}
                {!!n.assessment && (
                  <p>
                    <span className="font-[900] text-headingColor">A:</span> {n.assessment}
                  </p>
                )}
                {!!n.plan && (
                  <p>
                    <span className="font-[900] text-headingColor">P:</span> {n.plan}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default HealthRecords

