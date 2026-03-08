import { doctorsDb, reviewsDb } from './db.js'

const DEFAULT_DOCTORS = [
  {
    _id: 'ben',
    name: 'Dr. Ben',
    specialty: 'kupal',
    location: 'Bundok ng tralala, anti kulugo klinik',
    price: 700,
    about: 'Specialist providing compassionate care and clear guidance for every patient.',
    education: [{ years: '2008-2010', degree: 'BSc degree in Neurosciences', place: 'New Apollo Hospital' }],
    timeSlots: [
      { day: 'Sunday', from: '4:30 pm', to: '9:30 pm' },
      { day: 'Tuesday', from: '4:30 pm', to: '9:30 pm' },
      { day: 'Thursday', from: '5:00 pm', to: '8:30 pm' },
    ],
  },
  {
    _id: 'alex',
    name: 'Dr. Alex',
    specialty: 'Mahaba dumila',
    location: 'eatbulaga',
    price: 700,
    about: 'Focused on evidence-based care, fast diagnostics, and patient-first communication.',
    education: [{ years: '2011-2014', degree: 'Doctor of Medicine', place: "St. Luke's Medical Center" }],
    timeSlots: [
      { day: 'Monday', from: '2:00 pm', to: '6:00 pm' },
      { day: 'Wednesday', from: '2:00 pm', to: '6:00 pm' },
    ],
  },
  {
    _id: 'lei',
    name: 'Dr. Lei',
    specialty: 'Sir tapos na po',
    location: 'Quiapo',
    price: 700,
    about: 'Committed to safe treatment plans and long-term wellness for patients and families.',
    education: [{ years: '2015-2018', degree: 'Residency Program', place: 'Philippine General Hospital' }],
    timeSlots: [
      { day: 'Friday', from: '1:00 pm', to: '5:00 pm' },
      { day: 'Saturday', from: '10:00 am', to: '2:00 pm' },
    ],
  },
]

export async function ensureSeeded() {
  // Migrate legacy IDs (used in older builds) to the new IDs used by the frontend.
  // This prevents `/doctors/ben|alex|lei` from returning 404 when an existing NeDB file already has old IDs.
  const migrations = [
    { from: 'Malupiton', to: 'ben', name: 'Dr. Ben' },
    { from: 'alden', to: 'alex', name: 'Dr. Alex' },
    { from: 'coco', to: 'lei', name: 'Dr. Lei' },
  ]

  for (const m of migrations) {
    const oldDoc = await doctorsDb.findOne({ _id: m.from })
    const newDoc = await doctorsDb.findOne({ _id: m.to })

    if (oldDoc && !newDoc) {
      await doctorsDb.insert({ ...oldDoc, _id: m.to, name: m.name })
    }

    if (oldDoc) {
      await doctorsDb.remove({ _id: m.from }, {})
      await reviewsDb.update({ doctorId: m.from }, { $set: { doctorId: m.to } }, { multi: true })
    }
  }

  // Ensure the current defaults exist (without wiping existing data).
  const existing = await doctorsDb.find({})
  const existingIds = new Set(existing.map((d) => d?._id).filter(Boolean))
  const missing = DEFAULT_DOCTORS.filter((d) => !existingIds.has(d._id))
  if (missing.length > 0) await doctorsDb.insert(missing)

  // If DB is empty for any reason, seed defaults.
  const count = await doctorsDb.count({})
  if (count === 0) await doctorsDb.insert(DEFAULT_DOCTORS)
}

