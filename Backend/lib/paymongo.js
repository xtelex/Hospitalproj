import crypto from 'node:crypto'

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'

const basicAuthHeader = (secretKey) => {
  // PayMongo uses HTTP Basic Auth: username = SECRET_KEY, password is blank.
  const token = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${token}`
}

export const createPaymongoCheckoutSession = async ({
  secretKey,
  appointmentId,
  amountCentavos,
  description,
  successUrl,
  cancelUrl,
  paymentMethodTypes = ['gcash', 'card'],
}) => {
  if (!secretKey) throw new Error('PAYMONGO_SECRET_KEY is not set.')
  const sk = String(secretKey).trim()
  if (sk.includes('...')) {
    throw new Error(
      "PAYMONGO_SECRET_KEY is masked (contains '...'). In PayMongo dashboard, use the Copy/Reveal button or generate a new Secret Key, then paste the full sk_test_... / sk_live_... value.",
    )
  }
  if (/^pk_(test|live)_/.test(sk)) {
    throw new Error('You pasted a PayMongo Public Key (pk_*). Use the Secret Key (sk_*) for the backend.')
  }
  if (/^whsec_/.test(sk)) {
    throw new Error('You pasted the Webhook Signing Secret (whsec_*). Use the Secret Key (sk_*) for the backend.')
  }
  if (!/^sk_(test|live)_/.test(sk)) {
    throw new Error('PAYMONGO_SECRET_KEY looks invalid. It must start with sk_test_... or sk_live_....')
  }
  if (sk.length < 20) {
    throw new Error('PAYMONGO_SECRET_KEY looks too short. Copy the full sk_test_... / sk_live_... value from PayMongo.')
  }
  if (!successUrl || !cancelUrl) throw new Error('Missing success/cancel URL.')

  const body = {
    data: {
      attributes: {
        // The most important part: allowed payment methods
        payment_method_types: paymentMethodTypes,

        // This is what PayMongo will display on the checkout page
        line_items: [
          {
            name: 'Hospital appointment',
            amount: amountCentavos,
            currency: 'PHP',
            quantity: 1,
          },
        ],
        description: description || `Appointment ${appointmentId}`,

        // This is how we link a PayMongo payment back to your DB record.
        // We'll use it in the webhook handler.
        reference_number: String(appointmentId),

        success_url: successUrl,
        cancel_url: cancelUrl,
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
      },
    },
  }

  const res = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(sk),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.code ||
      data?.message ||
      `PayMongo error (${res.status})`
    throw new Error(msg)
  }

  const checkoutSessionId = data?.data?.id
  const checkoutUrl = data?.data?.attributes?.checkout_url
  if (!checkoutSessionId || !checkoutUrl) throw new Error('PayMongo response missing checkout session details.')

  return { checkoutSessionId, checkoutUrl, raw: data }
}

const safeEqualHex = (aHex, bHex) => {
  if (!aHex || !bHex) return false
  const a = Buffer.from(String(aHex), 'hex')
  const b = Buffer.from(String(bHex), 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

const parsePaymongoSignature = (headerValue) => {
  // Example header (from PayMongo docs):
  // t=1700000000,te=...,li=...
  const out = {}
  const parts = String(headerValue || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (!k || !v) continue
    out[k] = v
  }
  return out
}

export const verifyPaymongoWebhook = ({
  rawBody,
  signatureHeader,
  webhookSecret,
  mode, // "test" | "live" | undefined
  toleranceSeconds = 5 * 60,
}) => {
  if (!webhookSecret) return { ok: false, reason: 'PAYMONGO_WEBHOOK_SECRET is not set.' }
  if (!rawBody || !Buffer.isBuffer(rawBody)) return { ok: false, reason: 'Raw body buffer is required.' }

  const sig = parsePaymongoSignature(signatureHeader)
  const t = Number(sig.t)
  if (!Number.isFinite(t)) return { ok: false, reason: 'Invalid signature timestamp.' }

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - t) > toleranceSeconds) return { ok: false, reason: 'Signature timestamp outside tolerance.' }

  const signedPayload = `${t}.${rawBody.toString('utf8')}`
  const computed = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex')

  const expected =
    mode === 'live' ? sig.li : mode === 'test' ? sig.te : null

  const ok =
    (expected ? safeEqualHex(computed, expected) : false) ||
    (!expected && (safeEqualHex(computed, sig.te) || safeEqualHex(computed, sig.li)))

  if (!ok) return { ok: false, reason: 'Signature mismatch.' }

  return { ok: true }
}
