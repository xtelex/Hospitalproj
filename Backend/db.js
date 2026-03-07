import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Datastore from 'nedb-promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '.data')
await fs.mkdir(dataDir, { recursive: true })

export const doctorsDb = Datastore.create({
  filename: path.join(dataDir, 'doctors.db'),
  autoload: true,
})

export const reviewsDb = Datastore.create({
  filename: path.join(dataDir, 'reviews.db'),
  autoload: true,
})

export const usersDb = Datastore.create({
  filename: path.join(dataDir, 'users.db'),
  autoload: true,
})

await doctorsDb.ensureIndex({ fieldName: '_id', unique: true })
await reviewsDb.ensureIndex({ fieldName: 'doctorId' })
await reviewsDb.ensureIndex({ fieldName: 'createdAt' })

await usersDb.ensureIndex({ fieldName: '_id', unique: true })
await usersDb.ensureIndex({ fieldName: 'email', unique: true })
await usersDb.ensureIndex({ fieldName: 'createdAt' })
