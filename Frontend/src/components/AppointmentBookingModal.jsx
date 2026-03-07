import { useMemo, useState } from 'react'

const tomorrowLocalDate = () => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const AppointmentBookingModal = ({ open, doctor, defaultName, defaultAddress, onClose, onConfirm }) => {
  const [patientName, setPatientName] = useState(defaultName || '')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState(defaultAddress || '')
  const [date, setDate] = useState(tomorrowLocalDate())
  const [time, setTime] = useState('09:00')
  const [paymentMethod, setPaymentMethod] = useState('gcash')
  const [triageLevel, setTriageLevel] = useState('routine')
  const [visitType, setVisitType] = useState('first-time')
  const [symptoms, setSymptoms] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const doctorLabel = useMemo(() => {
    const parts = []
    if (doctor?.name) parts.push(doctor.name)
    if (doctor?.specialty) parts.push(doctor.specialty)
    return parts.join(' • ') || 'Doctor'
  }, [doctor])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-[720px] rounded-2xl bg-white border border-[#e7eff7] shadow-[rgba(17,12,46,0.20)_0px_40px_120px_0px]">
        <div className="p-6 flex items-start justify-between gap-4 border-b border-[#eef4fb]">
          <div className="min-w-0">
            <p className="text-headingColor font-[900] text-[18px] truncate">Book an appointment</p>
            <p className="mt-1 text-textColor text-[13px] truncate">{doctorLabel}</p>
            {doctor?.location && <p className="mt-1 text-textColor text-[12px] truncate">{doctor.location}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 px-4 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>

        <form
          className="p-6"
          onSubmit={async (e) => {
            e.preventDefault()
            if (submitting) return

            const trimmedName = patientName.trim()
            const trimmedAddress = address.trim()
            const ageNum = Number(age)

            if (!trimmedName) {
              alert('Please enter your name.')
              return
            }
            if (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 150) {
              alert('Please enter a valid age.')
              return
            }
            if (!trimmedAddress) {
              alert('Please enter your address.')
              return
            }
            if (!date) {
              alert('Please select a date.')
              return
            }
            if (!time) {
              alert('Please select a time.')
              return
            }

            const scheduled = new Date(`${date}T${time}`)
            if (!Number.isFinite(scheduled.getTime())) {
              alert('Please choose a valid date/time.')
              return
            }
            if (scheduled.getTime() < Date.now()) {
              alert('Please choose a future date/time.')
              return
            }

            try {
              setSubmitting(true)
              await Promise.resolve(
            onConfirm({
              patientName: trimmedName,
              patientAge: ageNum,
              patientAddress: trimmedAddress,
              paymentMethod,
              triageLevel,
              visitType,
              symptoms,
              scheduledAt: scheduled.toISOString(),
            }),
          )
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-[13px] font-[800] text-headingColor">Visit type</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisitType('first-time')}
                  disabled={submitting}
                  className={[
                    'h-12 rounded-xl border font-[900] transition',
                    visitType === 'first-time'
                      ? 'bg-primaryColor text-white border-primaryColor'
                      : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                    submitting ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  First-time
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType('follow-up')}
                  disabled={submitting}
                  className={[
                    'h-12 rounded-xl border font-[900] transition',
                    visitType === 'follow-up'
                      ? 'bg-primaryColor text-white border-primaryColor'
                      : 'bg-white border-[#e7eff7] text-headingColor hover:border-primaryColor',
                    submitting ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  Follow-up
                </button>
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className="text-[13px] font-[800] text-headingColor">Triage level</span>
              <select
                value={triageLevel}
                onChange={(e) => setTriageLevel(e.target.value)}
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                disabled={submitting}
              >
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
              <p className="mt-2 text-[12px] text-textColor">Helps the doctor prioritize the queue.</p>
            </label>

            <label className="block">
              <span className="text-[13px] font-[800] text-headingColor">Name</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                placeholder="Your full name"
                required
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-[800] text-headingColor">Age</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                type="number"
                min="0"
                max="150"
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                placeholder="e.g. 21"
                required
                disabled={submitting}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-[13px] font-[800] text-headingColor">Address</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                placeholder="Street / Barangay / City"
                required
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-[800] text-headingColor">Date</span>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                required
                disabled={submitting}
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-[800] text-headingColor">Time</span>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                type="time"
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                required
                disabled={submitting}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-[13px] font-[800] text-headingColor">Mode of payment</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-2 w-full h-12 px-4 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                disabled={submitting}
              >
                <option value="gcash">GCash</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="text-[13px] font-[800] text-headingColor">Symptom shortlist</span>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-[#e7eff7] bg-white outline-none focus:border-primaryColor"
                placeholder="Briefly describe why you’re booking."
                disabled={submitting}
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 px-5 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              )}
              {submitting ? 'Booking...' : 'Confirm booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointmentBookingModal
