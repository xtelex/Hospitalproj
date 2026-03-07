const STORAGE_KEY = 'referrals:v1'

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

export const listReferrals = () => {
  const items = readJson(STORAGE_KEY, [])
  return Array.isArray(items) ? items : []
}

export const createReferral = ({ fromDoctorId, toDoctorId, patientUid, patientName, reason }) => {
  const now = new Date().toISOString()
  const referral = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fromDoctorId: String(fromDoctorId || '').trim(),
    toDoctorId: String(toDoctorId || '').trim(),
    patientUid: String(patientUid || '').trim(),
    patientName: String(patientName || '').trim(),
    reason: String(reason || '').trim(),
    createdAt: now,
  }

  const next = [referral, ...listReferrals()]
  writeJson(STORAGE_KEY, next)
  return referral
}

