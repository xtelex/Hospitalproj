import { useState } from 'react'

const ServiceThumbnail = ({
  src = '',
  type = 'heart',
  accent = '#0067FF',
  title = 'Service',
  tileClass = 'bg-gradient-to-b from-slate-100/70 to-slate-50/40',
}) => {
  const [imgFailed, setImgFailed] = useState(false)
  const icon = (() => {
    switch (type) {
      case 'ribbon':
        return (
          <>
            <path d="M12 3c3 0 4 2 4 4 0 4-8 6-8 10 0 2 2 4 4 4" />
            <path d="M12 3c-3 0-4 2-4 4 0 4 8 6 8 10 0 2-2 4-4 4" />
            <path d="M10 14l-2 7 4-3 4 3-2-7" />
          </>
        )
      case 'baby':
        return (
          <>
            <path d="M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            <path d="M9.5 10.5h.01M14.5 10.5h.01" />
            <path d="M10.2 13c.9.8 2.7.8 3.6 0" />
            <path d="M12 3c1.4 0 2.6.7 3.3 1.8" />
          </>
        )
      case 'chat':
        return (
          <>
            <path d="M6 7.5A4.5 4.5 0 0 1 10.5 3h3A4.5 4.5 0 0 1 18 7.5V11a4.5 4.5 0 0 1-4.5 4.5H11l-3.5 3v-3H10.5A4.5 4.5 0 0 1 6 11V7.5Z" />
            <path d="M9.25 8.75h5.5" />
            <path d="M9.25 11.25h3.5" />
          </>
        )
      case 'brain':
        return (
          <>
            <path d="M9 6.5a2.5 2.5 0 0 1 4.7-1.2A2.6 2.6 0 0 1 16 7.8v6.4A2.8 2.8 0 0 1 13.2 17H11a3 3 0 0 1-3-3V7.9A2.6 2.6 0 0 1 9 6.5Z" />
            <path d="M10.2 6.2c0 1 .8 1.8 1.8 1.8" />
            <path d="M13.8 6.2c0 1-.8 1.8-1.8 1.8" />
            <path d="M10.3 11.2c0 1 .8 1.8 1.8 1.8" />
            <path d="M13.7 11.2c0 1-.8 1.8-1.8 1.8" />
          </>
        )
      case 'flame':
        return (
          <>
            <path d="M12 3c2 3 1 5 0 6 2-.2 3.5-2 3.5-4 3 3 3.5 8.5.8 11.5A5.5 5.5 0 0 1 6.2 13c0-2.2 1.1-4 2.8-5.5-.2 2 1 3.2 3 3.5-.7-1.7-.3-4 0-8Z" />
          </>
        )
      case 'heart':
      default:
        return (
          <>
            <path d="M12 20s-7-4.5-9-9.5C1.5 7 3.8 4.5 7 4.5c1.7 0 3.2.9 4 2.2.8-1.3 2.3-2.2 4-2.2 3.2 0 5.5 2.5 4 6C19 15.5 12 20 12 20Z" />
            <path d="M5.5 11h2l1.5-3 2.2 6 1.4-3h2.9" />
          </>
        )
    }
  })()

  return (
    <div
      role="img"
      aria-label={`${title} thumbnail`}
      className={[
        'relative overflow-hidden w-[152px] h-[118px] rounded-2xl border border-white/60 shadow-[rgba(17,12,46,0.10)_0px_24px_70px_0px]',
        'grid place-items-center',
        tileClass,
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(90px_60px_at_35%_25%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_62%)]" />

      <div className="relative z-10 w-[68px] h-[68px] rounded-full bg-white/55 backdrop-blur border border-white/70 shadow-[rgba(17,12,46,0.12)_0px_18px_50px_0px] grid place-items-center">
        {src && !imgFailed ? (
          <img
            src={src}
            alt={`${title} thumbnail`}
            className="w-10 h-10 object-contain drop-shadow-[0_14px_22px_rgba(17,12,46,0.18)]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: accent }}
          >
            {icon}
          </svg>
        )}
      </div>
    </div>
  )
}

export default ServiceThumbnail
