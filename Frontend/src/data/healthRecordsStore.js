const keyFor = (uid) => `health-records:v1:${uid}`

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

export const getHealthRecords = (uid) => {
  const base = { vaccinations: [], prescriptions: [], allergies: [], soapNotes: [] }
  if (!uid) return base
  const data = readJson(keyFor(uid), base)
  return { ...base, ...(data || {}) }
}

export const saveHealthRecords = (uid, records) => {
  if (!uid) return
  writeJson(keyFor(uid), records)
}

export const addPrescription = (uid, rx) => {
  const store = getHealthRecords(uid)
  const next = {
    ...store,
    prescriptions: [{ id: `${Date.now()}`, ...rx }, ...(store.prescriptions || [])],
  }
  saveHealthRecords(uid, next)
  return next
}

export const addSoapNote = (uid, note) => {
  const store = getHealthRecords(uid)
  const next = {
    ...store,
    soapNotes: [{ id: `${Date.now()}`, ...note }, ...(store.soapNotes || [])],
  }
  saveHealthRecords(uid, next)
  return next
}

