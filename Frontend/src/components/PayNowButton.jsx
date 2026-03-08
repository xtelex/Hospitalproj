import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const errorToMessage = (err) => {
  if (!err) return 'Something went wrong.'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || 'Something went wrong.'
  try {
    return JSON.stringify(err)
  } catch {
    return 'Something went wrong.'
  }
}

// Usage:
// <PayNowButton appointmentId={appointment._id} amount={700} />
// `amount` is in PHP pesos (e.g., 700 = PHP 700.00). Backend converts to centavos.
export default function PayNowButton({
  appointmentId,
  amount,
  paymentMethodTypes = ['gcash', 'card'],
  className = '',
  disabled = false,
  children = 'Pay Now',
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className={['inline-flex flex-col items-end gap-2', className].join(' ')}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={async () => {
          setError('')

          if (!appointmentId) {
            setError('Missing appointment ID.')
            return
          }
          if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            setError('Invalid amount.')
            return
          }

          try {
            setLoading(true)
            const res = await fetch(`${API_BASE}/payments/create-checkout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appointmentId,
                amount: Number(amount),
                paymentMethodTypes,
              }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) {
              const msg = typeof data?.error === 'string' ? data.error : data?.error?.message || 'Failed to create checkout.'
              throw new Error(msg)
            }
            if (!data?.checkoutUrl) throw new Error('Missing checkoutUrl.')
            window.location.href = data.checkoutUrl
          } catch (e) {
            const msg = errorToMessage(e)
            setError(
              msg === 'PAYMONGO_SECRET_KEY is not set.'
                ? 'Payments are not configured yet. Set PAYMONGO_SECRET_KEY in the backend and restart the server.'
                : msg,
            )
          } finally {
            setLoading(false)
          }
        }}
        className={[
          'h-11 px-5 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition',
          'disabled:opacity-60 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        {loading ? 'Redirecting...' : children}
      </button>

      {!!error && (
        <p className="max-w-[420px] text-right text-[12px] leading-5 font-[800] text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  )
}
