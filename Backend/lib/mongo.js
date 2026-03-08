let mongooseInstance = null

const loadMongoose = async () => {
  if (mongooseInstance) return mongooseInstance
  try {
    const mod = await import('mongoose')
    mongooseInstance = mod?.default || mod
    return mongooseInstance
  } catch {
    return null
  }
}

export const connectMongo = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) return null

  const mongoose = await loadMongoose()
  if (!mongoose) throw new Error('Missing dependency: mongoose (run `npm install` in Backend).')

  if (mongoose.connection?.readyState === 1) return mongoose.connection

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  return mongoose.connection
}

export const isMongoConnected = () => mongooseInstance?.connection?.readyState === 1

export const getMongoose = async () => loadMongoose()
