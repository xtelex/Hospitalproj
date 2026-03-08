import docBenImg from '../assets/images/docben.png'
import alexImg from '../assets/images/alex.png'
import docLeiImg from '../assets/images/doclei.png'

export const DOCTOR_DIRECTORY = {
  ben: { id: 'ben', name: 'Dr. Ben', photo: docBenImg, fallbackPhoto: '/images/malupiton.png' },
  alex: { id: 'alex', name: 'Dr. Alex', photo: alexImg, fallbackPhoto: '/images/alden.png' },
  lei: { id: 'lei', name: 'Dr. Lei', photo: docLeiImg, fallbackPhoto: '/images/coco.png' },
}

export const listDoctorDirectory = () => Object.values(DOCTOR_DIRECTORY)

export const getDoctorDirectoryEntry = (doctorId) => {
  const key = String(doctorId || '').trim().toLowerCase()
  return DOCTOR_DIRECTORY[key] || null
}

