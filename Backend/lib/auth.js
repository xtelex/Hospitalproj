import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function signAccessToken({ userId, role }) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function requireAdminToken(req) {
  const token = req.header('x-admin-token') || ''
  const expected = process.env.ADMIN_TOKEN || ''
  return expected && token === expected
}

