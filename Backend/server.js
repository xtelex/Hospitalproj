import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import doctorsRouter from './routes/doctors.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import protectedExampleRouter from './routes/protectedExample.js'
import { ensureSeeded } from './seed.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

await ensureSeeded()

app.use('/api', doctorsRouter)
app.use('/api', authRouter)
app.use('/api', adminRouter)
app.use('/api', protectedExampleRouter)

const port = Number(process.env.PORT || 3001)
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})
