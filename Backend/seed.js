import { doctorsDb } from './db.js'

const DEFAULT_DOCTORS = [
  {
    _id: 'Malupiton',
    name: 'Dr. Malupiton',
    specialty: 'kupal',
    location: 'Bundok ng tralala, anti kulugo klinik',
    price: 700,
    about:
      'Specialist providing compassionate care and clear guidance for every patient.',
    education: [
      { years: '2008-2010', degree: 'BSc degree in Neurosciences', place: 'New Apollo Hospital' },
    ],
    timeSlots: [
      { day: 'Sunday', from: '4:30 pm', to: '9:30 pm' },
      { day: 'Tuesday', from: '4:30 pm', to: '9:30 pm' },
      { day: 'Thursday', from: '5:00 pm', to: '8:30 pm' },
    ],
  },
  {
    _id: 'alden',
    name: 'Dr. Alden Ricardo',
    specialty: 'Mahaba dumila',
    location: 'eatbulaga',
    price: 700,
    about:
      'Focused on evidence-based care, fast diagnostics, and patient-first communication.',
    education: [
      { years: '2011-2014', degree: 'Doctor of Medicine', place: 'St. Luke\'s Medical Center' },
    ],
    timeSlots: [
      { day: 'Monday', from: '2:00 pm', to: '6:00 pm' },
      { day: 'Wednesday', from: '2:00 pm', to: '6:00 pm' },
    ],
  },
  {
    _id: 'coco',
    name: 'Dr. Coco ni Martin',
    specialty: 'Sir tapos na po',
    location: 'Quiapo',
    price: 700,
    about:
      'Committed to safe treatment plans and long-term wellness for patients and families.',
    education: [
      { years: '2015-2018', degree: 'Residency Program', place: 'Philippine General Hospital' },
    ],
    timeSlots: [
      { day: 'Friday', from: '1:00 pm', to: '5:00 pm' },
      { day: 'Saturday', from: '10:00 am', to: '2:00 pm' },
    ],
  },
]

export async function ensureSeeded() {
  const count = await doctorsDb.count({})
  if (count > 0) return

  await doctorsDb.insert(DEFAULT_DOCTORS)
}