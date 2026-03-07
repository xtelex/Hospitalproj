import { Router } from 'express'
import { requireAuth, requireVerifiedDoctor, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

// Example protected route: only verified doctors can access.
router.get('/doctor/patient-labs/:patientId', requireAuth, requireVerifiedDoctor, async (req, res) => {
  res.json({
    ok: true,
    patientId: String(req.params.patientId),
    labs: [],
    message: 'Example route: plug your real lab results here.',
  })
})

// Example: only patients can access.
router.get('/patient/my-bookings', requireAuth, requireRole('patient'), async (_req, res) => {
  res.json({ ok: true, bookings: [] })
})

export default router

