const keyFor = (recipientType, recipientId) => `notifications:v1:${recipientType}:${String(recipientId || '').trim().toLowerCase()}`

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
    // ignore quota/private mode
  }
}

export const listNotifications = (recipientType, recipientId) => {
  if (!recipientType || !recipientId) return []
  const items = readJson(keyFor(recipientType, recipientId), [])
  return Array.isArray(items) ? items : []
}

export const createNotification = ({
  recipientType,
  recipientId,
  type,
  title,
  body,
  meta,
  createdAt,
}) => {
  if (!recipientType || !recipientId) return null
  const now = createdAt || new Date().toISOString()
  const notification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: String(type || 'info'),
    title: String(title || '').trim(),
    body: String(body || '').trim(),
    meta: meta || {},
    read: false,
    createdAt: now,
  }

  const items = listNotifications(recipientType, recipientId)
  writeJson(keyFor(recipientType, recipientId), [notification, ...items].slice(0, 200))
  return notification
}

export const markNotificationRead = (recipientType, recipientId, notificationId) => {
  if (!recipientType || !recipientId || !notificationId) return
  const items = listNotifications(recipientType, recipientId)
  const next = items.map((n) => (n?.id === notificationId ? { ...n, read: true } : n))
  writeJson(keyFor(recipientType, recipientId), next)
}

export const markAllNotificationsRead = (recipientType, recipientId) => {
  if (!recipientType || !recipientId) return
  const items = listNotifications(recipientType, recipientId)
  const next = items.map((n) => ({ ...n, read: true }))
  writeJson(keyFor(recipientType, recipientId), next)
}

export const getUnreadCount = (recipientType, recipientId) =>
  listNotifications(recipientType, recipientId).filter((n) => !n?.read).length

export const ensureAppointmentReminders = ({ doctorId, upcomingAppointments }) => {
  const id = String(doctorId || '').trim()
  if (!id) return

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const items = listNotifications('doctor', id)

  const hasReminderFor = (appointmentId) =>
    items.some((n) => n?.type === 'appointment_reminder' && n?.meta?.appointmentId === appointmentId)

  for (const a of Array.isArray(upcomingAppointments) ? upcomingAppointments : []) {
    const t = new Date(a?.scheduledAt).getTime()
    if (!Number.isFinite(t)) continue
    const msUntil = t - now
    if (msUntil <= 0 || msUntil > dayMs) continue
    if (hasReminderFor(a.id)) continue

    createNotification({
      recipientType: 'doctor',
      recipientId: id,
      type: 'appointment_reminder',
      title: 'Appointment tomorrow',
      body: `${a.patientName || a.patientEmail || 'A patient'} has an appointment within 24 hours.`,
      meta: { appointmentId: a.id, scheduledAt: a.scheduledAt, patientUid: a.patientUid },
    })
  }
}

