import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import ServiceThumbnail from '../components/ServiceThumbnail'
import { SERVICES } from '../data/services'

const Services = () => {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(950px_650px_at_18%_22%,rgba(151,113,255,0.16)_0%,rgba(151,113,255,0)_62%),radial-gradient(950px_650px_at_86%_28%,rgba(1,181,197,0.14)_0%,rgba(1,181,197,0)_60%),radial-gradient(950px_650px_at_55%_95%,rgba(254,182,13,0.12)_0%,rgba(254,182,13,0)_62%)]" />

      <div className="container">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[38px] md:text-[52px] leading-tight font-[800] text-headingColor">Our medical services</h1>
          <p className="text-textColor mt-4">
            World-class care for everyone. Our health system offers unmatched, expert health care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-16 mt-16 place-items-center">
          {SERVICES.map((s) => (
            <div key={s.n} className="relative text-center w-full max-w-[420px]">
              <div className="mx-auto w-fit">
                <ServiceThumbnail
                  src={s.thumbSrc}
                  tileClass={s.tileClass}
                  type={s.thumb}
                  accent={s.accent}
                  title={s.title}
                />
              </div>
              <h3 className="mt-4 text-[20px] font-[900] text-headingColor">{s.title}</h3>
              <p className="text-textColor mt-3 leading-7 max-w-[380px] mx-auto">
                World-class care for everyone. Our health system offers unmatched, expert health care. From the lab to the
                clinic.
              </p>

              <div className="mt-8 flex items-center justify-center gap-10">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-textColor/30 hover:border-primaryColor hover:text-primaryColor transition"
                  aria-label={`Open ${s.title}`}
                >
                  <FiArrowRight className="text-[18px]" />
                </Link>

                <div
                  className={[
                    'w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-[800] shadow-sm ring-1 ring-black/5',
                    s.badge,
                  ].join(' ')}
                >
                  {s.n}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
