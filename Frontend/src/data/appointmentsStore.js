const STORAGE_KEY = 'appointments:v1'

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
  localStorage.setItem(key, JSON.stringify(value))
}

export const getRoleForUser = (uid) => {
  if (!uid) return 'patient'
  return localStorage.getItem(`role:${uid}`) || 'patient'
}

export const setRoleForUser = (uid, role) => {
  if (!uid) return
  localStorage.setItem(`role:${uid}`, role === 'doctor' ? 'doctor' : 'patient')
}

export const getDoctorIdForUser = (uid) => {
  if (!uid) return ''
  return localStorage.getItem(`doctorId:${uid}`) || ''
}

export const setDoctorIdForUser = (uid, doctorId) => {
  if (!uid) return
  localStorage.setItem(`doctorId:${uid}`, String(doctorId || '').trim())
}

export const listAppointments = () => {
  const items = readJson(STORAGE_KEY, [])
  return Array.isArray(items) ? items : []
}

export const saveAppointments = (items) => {
  writeJson(STORAGE_KEY, Array.isArray(items) ? items : [])
}

export const createAppointment = ({
  doctorId,
  doctorName,
  doctorSpecialty,
  doctorLocation,
  patientUid,
  patientName,
  patientEmail,
  patientAge,
  patientAddress,
  paymentMethod,
  triageLevel,
  visitType,
  symptoms,
  status,
  scheduledAt,
}) => {
  const now = new Date().toISOString()
  const appointment = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    doctorId: String(doctorId || '').trim(),
    doctorName: String(doctorName || '').trim(),
    doctorSpecialty: String(doctorSpecialty || '').trim(),
    doctorLocation: String(doctorLocation || '').trim(),
    patientUid: String(patientUid || '').trim(),
    patientName: String(patientName || '').trim(),
    patientEmail: String(patientEmail || '').trim(),
    patientAge: patientAge === undefined || patientAge === null ? null : Number(patientAge),
    patientAddress: String(patientAddress || '').trim(),
    paymentMethod: String(paymentMethod || '').trim(),
    triageLevel: String(triageLevel || 'routine').trim().toLowerCase(),
    visitType: String(visitType || '').trim(),
    symptoms: String(symptoms || '').trim(),
    status: String(status || 'pending').trim().toLowerCase(),
    scheduledAt,
    createdAt: now,
    updatedAt: now,
  }

  const next = [appointment, ...listAppointments()]
  saveAppointments(next)
  return appointment
}

export const deleteAppointment = (appointmentId) => {
  const next = listAppointments().filter((a) => a?.id !== appointmentId)
  saveAppointments(next)
}

export const updateAppointment = (appointmentId, patch) => {
  const items = listAppointments()
  const idx = items.findIndex((a) => a?.id === appointmentId)
  if (idx < 0) return null
  const now = new Date().toISOString()
  const next = {
    ...items[idx],
    ...(patch || {}),
    updatedAt: now,
  }
  const updated = [next, ...items.filter((a) => a?.id !== appointmentId)]
  saveAppointments(updated)
  return next
}

export const getPatientAppointments = (patientUid) => {
  if (!patientUid) return []
  return listAppointments().filter((a) => a?.patientUid === patientUid)
}

export const getDoctorAppointments = (doctorId) => {
  const id = String(doctorId || '').trim()
  if (!id) return []
  return listAppointments().filter((a) => a?.doctorId === id)
}

export const splitPastUpcoming = (appointments) => {
  const now = Date.now()
  const items = Array.isArray(appointments) ? appointments : []

  const upcoming = []
  const past = []

  for (const a of items) {
    const t = new Date(a?.scheduledAt).getTime()
    if (Number.isFinite(t) && t >= now) upcoming.push(a)
    else past.push(a)
  }

  upcoming.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  past.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  return { upcoming, past }
}
