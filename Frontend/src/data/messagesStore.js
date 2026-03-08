import { createNotification } from './notificationsStore'

const threadKey = (doctorId, patientUid) =>
  `messages:v1:${String(doctorId || '').trim().toLowerCase()}:${String(patientUid || '').trim()}`

const doctorIndexKey = (doctorId) => `messages:index:doctor:v1:${String(doctorId || '').trim().toLowerCase()}`
const patientIndexKey = (patientUid) => `messages:index:patient:v1:${String(patientUid || '').trim()}`

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

export const listMessages = (doctorId, patientUid) => {
  if (!doctorId || !patientUid) return []
  const items = readJson(threadKey(doctorId, patientUid), [])
  return Array.isArray(items) ? items : []
}

const upsertIndexEntry = (key, entry) => {
  const items = readJson(key, [])
  const next = Array.isArray(items) ? items : []
  const filtered = next.filter((x) => x?.id !== entry.id)
  writeJson(key, [entry, ...filtered].slice(0, 100))
}

export const listDoctorThreads = (doctorId) => {
  if (!doctorId) return []
  const items = readJson(doctorIndexKey(doctorId), [])
  return Array.isArray(items) ? items : []
}

export const listPatientThreads = (patientUid) => {
  if (!patientUid) return []
  const items = readJson(patientIndexKey(patientUid), [])
  return Array.isArray(items) ? items : []
}

export const sendMessage = ({
  doctorId,
  doctorName,
  patientUid,
  patientName,
  fromRole, // 'patient' | 'doctor'
  text,
}) => {
  const did = String(doctorId || '').trim()
  const puid = String(patientUid || '').trim()
  const body = String(text || '').trim()
  if (!did || !puid || !body) return null

  const now = new Date().toISOString()
  const msg = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fromRole: fromRole === 'doctor' ? 'doctor' : 'patient',
    text: body,
    createdAt: now,
  }

  const next = [...listMessages(did, puid), msg]
  writeJson(threadKey(did, puid), next.slice(-300))

  upsertIndexEntry(doctorIndexKey(did), {
    id: puid,
    name: String(patientName || puid),
    doctorId: did,
    doctorName: String(doctorName || did),
    lastText: body,
    lastAt: now,
  })

  upsertIndexEntry(patientIndexKey(puid), {
    id: did,
    name: String(doctorName || did),
    patientUid: puid,
    patientName: String(patientName || puid),
    lastText: body,
    lastAt: now,
  })

  if (msg.fromRole === 'patient') {
    createNotification({
      recipientType: 'doctor',
      recipientId: did,
      type: 'message',
      title: 'New patient message',
      body: `${String(patientName || 'A patient')}: ${body}`,
      meta: { doctorId: did, patientUid: puid },
    })
  } else {
    createNotification({
      recipientType: 'user',
      recipientId: puid,
      type: 'message',
      title: 'New doctor message',
      body: `${String(doctorName || 'Doctor')}: ${body}`,
      meta: { doctorId: did },
    })
  }

  return msg
}

