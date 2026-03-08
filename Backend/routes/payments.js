import express from 'express'
import { z } from 'zod'

import { getAppointmentModel } from '../models/Appointment.js'
import { isMongoConnected } from '../lib/mongo.js'
import { createPaymongoCheckoutSession, verifyPaymongoWebhook } from '../lib/paymongo.js'

const createCheckoutSchema = z.object({
  appointmentId: z.string().min(1),
  // Accept pesos (e.g., 700 or 700.5). We convert to centavos on the server.
  amount: z.number().positive(),
  paymentMethodTypes: z.array(z.enum(['gcash', 'card'])).optional(),
})

export const paymentsWebhookRouter = express.Router()
export const paymentsRouter = express.Router()

// POST /api/payments/create-checkout
paymentsRouter.post('/payments/create-checkout', async (req, res) => {
  const parsed = createCheckoutSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { appointmentId, amount, paymentMethodTypes } = parsed.data

  // IMPORTANT: Never trust amounts coming from the browser in production.
  // Always compute the payable amount server-side from your DB (doctor fee, services, etc.).
  const requestedAmountCentavos = Math.round(Number(amount) * 100)

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const successUrl = `${frontendUrl}/profile?payment=success&appointmentId=${encodeURIComponent(appointmentId)}`
  const cancelUrl = `${frontendUrl}/profile?payment=cancelled&appointmentId=${encodeURIComponent(appointmentId)}`

  let amountCentavos = requestedAmountCentavos
  let appt = null

  if (isMongoConnected()) {
    const Appointment = await getAppointmentModel()
    if (Appointment) {
      appt = await Appointment.findById(appointmentId).catch(() => null)
      if (appt?.amount !== undefined && appt?.amount !== null) {
        amountCentavos = Number(appt.amount) || requestedAmountCentavos
      }
    }
  }

  try {
    const { checkoutSessionId, checkoutUrl } = await createPaymongoCheckoutSession({
      secretKey: process.env.PAYMONGO_SECRET_KEY,
      appointmentId,
      amountCentavos,
      successUrl,
      cancelUrl,
      paymentMethodTypes: paymentMethodTypes?.length ? paymentMethodTypes : ['gcash', 'card'],
    })

    if (appt) {
      appt.paymentId = checkoutSessionId
      appt.paymentStatus = 'pending'
      await appt.save()
    } else if (isMongoConnected()) {
      // If the appointment doesn't exist yet, you can still create a checkout session,
      // but the webhook won't be able to update it. Create appointments first.
    }

    return res.json({ checkoutUrl, checkoutSessionId })
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
})

// POST /api/payments/webhook
// NOTE: This route must receive the *raw* request body (Buffer) so we can verify the signature.
// In `server.js` we mount this router with `express.raw({ type: 'application/json' })`.
paymentsWebhookRouter.post('/', async (req, res) => {
  const rawBody = req.body

  const verify = verifyPaymongoWebhook({
    rawBody,
    signatureHeader: req.header('paymongo-signature') || req.header('Paymongo-Signature') || req.header('PayMongo-Signature'),
    webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET,
    mode: process.env.PAYMONGO_MODE,
  })

  if (!verify.ok) return res.status(400).json({ error: verify.reason || 'Invalid signature' })

  let payload = null
  try {
    payload = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const eventType = payload?.data?.attributes?.type
  if (eventType !== 'checkout_session.payment.paid') {
    // Acknowledge other event types.
    return res.json({ ok: true })
  }

  const checkoutSession = payload?.data?.attributes?.data
  const checkoutSessionId = checkoutSession?.id
  const referenceNumber = checkoutSession?.attributes?.reference_number

  if (!referenceNumber) return res.json({ ok: true })
  if (!isMongoConnected()) return res.json({ ok: true, skipped: true, reason: 'MongoDB not configured (MONGODB_URI).' })

  const Appointment = await getAppointmentModel()
  if (!Appointment) return res.json({ ok: true, skipped: true, reason: 'Mongo model unavailable.' })

  const appt = await Appointment.findById(referenceNumber).catch(() => null)
  if (!appt) return res.json({ ok: true })

  // Idempotent update: webhook can be retried by PayMongo.
  if (appt.paymentStatus !== 'paid' || appt.status !== 'paid') {
    appt.paymentId = checkoutSessionId || appt.paymentId
    appt.paymentStatus = 'paid'
    if (appt.status === 'pending') appt.status = 'paid'
    await appt.save()
  }

  return res.json({ ok: true })
})

export default paymentsRouter
