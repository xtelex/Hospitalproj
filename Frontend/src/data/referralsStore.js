import { createNotification } from './notificationsStore'

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

export const getIncomingReferrals = (doctorId) => {
  const id = String(doctorId || '').trim()
  if (!id) return []
  return listReferrals().filter((r) => String(r?.toDoctorId || '').trim().toLowerCase() === id.toLowerCase())
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

  createNotification({
    recipientType: 'doctor',
    recipientId: referral.toDoctorId,
    type: 'referral',
    title: 'New patient referral',
    body: `${referral.patientName || 'A patient'} was referred to you.`,
    meta: {
      referralId: referral.id,
      fromDoctorId: referral.fromDoctorId,
      patientUid: referral.patientUid,
      patientName: referral.patientName,
    },
    createdAt: now,
  })

  return referral
}
