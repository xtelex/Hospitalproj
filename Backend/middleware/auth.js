import { verifyAccessToken } from '../lib/auth.js'
import { usersDb } from '../db.js'

export async function requireAuth(req, res, next) {
  const header = req.header('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ error: 'Missing Bearer token' })

  try {
    const payload = verifyAccessToken(match[1])
    const user = await usersDb.findOne({ _id: String(payload.sub) })
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      isVerifiedDoctor: Boolean(user.isVerifiedDoctor),
    }
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token', details: String(e?.message || e) })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' })
    return next()
  }
}

export function requireVerifiedDoctor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Forbidden' })
  if (!req.user.isVerifiedDoctor) return res.status(403).json({ error: 'Doctor not verified' })
  return next()
}

