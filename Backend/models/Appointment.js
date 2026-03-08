import { getMongoose } from '../lib/mongo.js'

let cachedModel = null

// Minimal appointment model for payments.
// If you already have an Appointment schema, copy the `paymentId` and `paymentStatus` fields into it.
export const getAppointmentModel = async () => {
  if (cachedModel) return cachedModel

  const mongoose = await getMongoose()
  if (!mongoose) return null

  const AppointmentSchema = new mongoose.Schema(
    {
      doctorId: { type: String, required: true, index: true },
      patientUid: { type: String, required: true, index: true },
      scheduledAt: { type: Date, required: true, index: true },

      // Appointment lifecycle
      status: { type: String, enum: ['pending', 'paid', 'cancelled', 'completed'], default: 'pending', index: true },

      // Pricing (store as centavos to avoid floating-point issues)
      amount: { type: Number, required: true, min: 0 }, // e.g., 70000 = PHP 700.00
      currency: { type: String, default: 'PHP' },

      // Payment fields
      paymentId: { type: String, default: '' }, // PayMongo Checkout Session ID (cs_...)
      paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed'], default: 'unpaid', index: true },
    },
    { timestamps: true },
  )

  cachedModel = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema)
  return cachedModel
}

