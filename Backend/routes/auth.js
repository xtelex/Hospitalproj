import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { usersDb } from '../db.js'
import { signAccessToken } from '../lib/auth.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(200),
  role: z.enum(['patient', 'doctor']),
  licenseNumber: z.string().trim().min(3).max(80).optional(),
  name: z.string().trim().min(1).max(80).optional(),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  role: z.enum(['patient', 'doctor']),
})

function publicUser(u) {
  return {
    id: u._id,
    email: u.email,
    role: u.role,
    name: u.name || '',
    isVerifiedDoctor: Boolean(u.isVerifiedDoctor),
    createdAt: u.createdAt,
  }
}

router.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })

  const { email, password, role, licenseNumber, name } = parsed.data

  const existing = await usersDb.findOne({ email })
  if (existing) return res.status(409).json({ error: 'Email already in use' })

  const passwordHash = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()

  const user = await usersDb.insert({
    email,
    passwordHash,
    role,
    name: name || '',
    licenseNumber: role === 'doctor' ? (licenseNumber || '') : '',
    isVerifiedDoctor: role === 'doctor' ? false : true,
    createdAt: now,
    updatedAt: now,
  })

  // Registration gate: doctors must be verified before they can log in.
  if (role === 'doctor') {
    return res.status(201).json({
      user: publicUser(user),
      message: 'Doctor account created. Waiting for admin verification.',
    })
  }

  const token = signAccessToken({ userId: user._id, role: user.role })
  return res.status(201).json({ user: publicUser(user), token })
})

router.post('/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() })

  const { email, password, role } = parsed.data
  const user = await usersDb.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const ok = await bcrypt.compare(password, user.passwordHash || '')
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

  if (user.role !== role) {
    return res.status(403).json({ error: `This account is registered as ${user.role}.` })
  }

  if (role === 'doctor' && !user.isVerifiedDoctor) {
    return res.status(403).json({ error: 'Doctor account is not verified yet.' })
  }

  const token = signAccessToken({ userId: user._id, role: user.role })
  return res.json({ user: publicUser(user), token })
})

export default router

