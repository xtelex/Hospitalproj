import { Router } from 'express'
import { z } from 'zod'
import { usersDb } from '../db.js'
import { requireAdminToken } from '../lib/auth.js'

const router = Router()

const verifySchema = z.object({
  userId: z.string().min(1),
  isVerifiedDoctor: z.boolean().default(true),
})

router.post('/admin/verify-doctor', async (req, res) => {
  if (!requireAdminToken(req)) return res.status(401).json({ error: 'Missing/invalid x-admin-token' })

  const parsed = verifySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })

  const { userId, isVerifiedDoctor } = parsed.data
  const user = await usersDb.findOne({ _id: userId })
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.role !== 'doctor') return res.status(400).json({ error: 'User is not a doctor' })

  const now = new Date().toISOString()
  await usersDb.update({ _id: userId }, { $set: { isVerifiedDoctor, updatedAt: now } })
  const updated = await usersDb.findOne({ _id: userId })

  return res.json({
    ok: true,
    user: {
      id: updated._id,
      email: updated.email,
      role: updated.role,
      isVerifiedDoctor: Boolean(updated.isVerifiedDoctor),
      updatedAt: updated.updatedAt,
    },
  })
})

export default router

