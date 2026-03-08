const normalizeDoctorId = (doctorId) => String(doctorId || '').trim()

const keyForDoctorAvailability = (doctorId) => `doctorAvailability:${normalizeDoctorId(doctorId)}`
const keyForDoctorAvailabilityLower = (doctorId) => `doctorAvailability:${normalizeDoctorId(doctorId).toLowerCase()}`

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const normalizeDay = (v) => {
  const s = String(v || '').trim().toLowerCase()
  return WEEKDAYS.includes(s) ? s : null
}

const isTime = (v) => /^\d{2}:\d{2}$/.test(String(v || ''))

const normalizeTimes = (times) => {
  const uniq = new Set()
  for (const t of Array.isArray(times) ? times : []) {
    const s = String(t || '').trim()
    if (!isTime(s)) continue
    uniq.add(s)
  }
  return Array.from(uniq).sort()
}

const normalizeAvailability = (availability, fallback) => {
  const fb = fallback || {}
  const days = Array.from(
    new Set(
      (Array.isArray(availability?.days) ? availability.days : Array.isArray(fb.days) ? fb.days : [])
        .map(normalizeDay)
        .filter(Boolean),
    ),
  )
  const times = normalizeTimes(Array.isArray(availability?.times) ? availability.times : fb.times)
  return { days, times }
}

export const getDoctorAvailability = (doctorId, fallback) => {
  if (!doctorId) return normalizeAvailability(null, fallback)
  try {
    const raw =
      localStorage.getItem(keyForDoctorAvailability(doctorId)) ||
      localStorage.getItem(keyForDoctorAvailabilityLower(doctorId))
    if (!raw) return normalizeAvailability(null, fallback)
    return normalizeAvailability(JSON.parse(raw), fallback)
  } catch {
    return normalizeAvailability(null, fallback)
  }
}

export const setDoctorAvailability = (doctorId, availability) => {
  if (!doctorId) return
  try {
    const normalized = normalizeAvailability(availability, { days: [], times: [] })
    const payload = JSON.stringify(normalized)
    localStorage.setItem(keyForDoctorAvailability(doctorId), payload)
    localStorage.setItem(keyForDoctorAvailabilityLower(doctorId), payload)
  } catch {
    // Ignore storage errors (private mode/quota).
  }
}

export const clearDoctorAvailability = (doctorId) => {
  if (!doctorId) return
  try {
    localStorage.removeItem(keyForDoctorAvailability(doctorId))
    localStorage.removeItem(keyForDoctorAvailabilityLower(doctorId))
  } catch {
    // ignore
  }
}
