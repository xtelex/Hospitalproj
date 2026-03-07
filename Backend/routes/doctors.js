import { Router } from 'express'
import { z } from 'zod'
import { doctorsDb, reviewsDb } from '../db.js'

const router = Router()

function round1(n) {
  return Math.round(n * 10) / 10
}

async function getSummary(doctorId) {
  const reviews = await reviewsDb.find({ doctorId }).sort({ createdAt: -1 })
  const count = reviews.length
  const avg = count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / count
  return { ratingAvg: round1(avg), reviewCount: count }
}

router.get('/doctors', async (_req, res) => {
  const doctors = await doctorsDb.find({}).sort({ name: 1 })
  res.json(doctors)
})

router.get('/doctors/:id', async (req, res) => {
  const id = String(req.params.id)
  const doctor = await doctorsDb.findOne({ _id: id })
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  const summary = await getSummary(id)
  res.json({ ...doctor, ...summary })
})

router.get('/doctors/:id/reviews', async (req, res) => {
  const doctorId = String(req.params.id)
  const doctor = await doctorsDb.findOne({ _id: doctorId })
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  const reviews = await reviewsDb.find({ doctorId }).sort({ createdAt: -1 })
  res.json(reviews)
})

const createReviewSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(500),
})

router.post('/doctors/:id/reviews', async (req, res) => {
  const doctorId = String(req.params.id)
  const doctor = await doctorsDb.findOne({ _id: doctorId })
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  const parsed = createReviewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })
  }

  const now = new Date().toISOString()
  const review = await reviewsDb.insert({
    doctorId,
    name: parsed.data.name ?? 'Anonymous',
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    createdAt: now,
  })

  res.status(201).json(review)
})

export default router