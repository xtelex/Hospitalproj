import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import doctorsRouter from './routes/doctors.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import protectedExampleRouter from './routes/protectedExample.js'
import paymentsRouter, { paymentsWebhookRouter } from './routes/payments.js'
import { ensureSeeded } from './seed.js'
import { connectMongo } from './lib/mongo.js'
import { loadEnv } from './lib/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load Backend/.env for local development (keys should NOT be committed).
await loadEnv({ envPath: path.join(__dirname, '.env') })

const app = express()

app.use(cors())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  const rawKey = String(process.env.PAYMONGO_SECRET_KEY || '').trim()
  const paymongoKeyKind = rawKey.startsWith('sk_')
    ? 'secret'
    : rawKey.startsWith('pk_')
      ? 'public'
      : rawKey.startsWith('whsec_')
        ? 'webhook'
        : rawKey
          ? 'unknown'
          : 'missing'

  res.json({
    ok: true,
    paymongoConfigured: !!rawKey,
    // Safe debugging info (does not expose the key)
    paymongoKeyKind,
    paymongoKeyLength: rawKey.length,
  })
})

// Optional Mongo connection (required for appointment payment status updates)
try {
  await connectMongo()
} catch (e) {
  console.warn('Mongo connection failed:', String(e?.message || e))
}

await ensureSeeded()

// PayMongo webhooks require raw body verification, so mount BEFORE express.json().
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentsWebhookRouter)

app.use(express.json())

app.use('/api', doctorsRouter)
app.use('/api', authRouter)
app.use('/api', adminRouter)
app.use('/api', protectedExampleRouter)
app.use('/api', paymentsRouter)

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
