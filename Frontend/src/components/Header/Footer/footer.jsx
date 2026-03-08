import { Link } from 'react-router-dom'
import logo from '../../../assets/images/medikill.png'

const Footer = () => {
  return (
    <footer className="bg-[#fbfcfe] border-t border-[#e7eff7]">
      <div className="container">
        <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
              <p className="text-headingColor font-[800] text-[18px]">Medicare</p>
            </div>

            <p className="text-textColor mt-4 text-[14px] leading-7">
              Copyright {'\\u00A9'} {new Date().getFullYear()} developed by Muhibur Rahman all rights reserved.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
                { label: 'YouTube', to: '/' },
                { label: 'GitHub', to: '/' },
                { label: 'Instagram', to: '/' },
                { label: 'LinkedIn', to: '/' },
              ].map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full border border-textColor/20 grid place-items-center text-textColor hover:text-primaryColor hover:border-primaryColor transition"
                >
                  <span className="text-[14px] font-[700]">{s.label.slice(0, 1)}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-headingColor font-[700] mb-4">Quick Links</p>
            <ul className="space-y-3 text-textColor">
              <li>
                <Link to="/home" className="hover:text-primaryColor transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primaryColor transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-primaryColor transition">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primaryColor transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-headingColor font-[700] mb-4">I want to:</p>
            <ul className="space-y-3 text-textColor">
              <li>
                <Link to="/doctors" className="hover:text-primaryColor transition">
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primaryColor transition">
                  Request an Appointment
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primaryColor transition">
                  Find a Location
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primaryColor transition">
                  Get a Opinion
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-headingColor font-[700] mb-4">Support</p>
            <ul className="space-y-3 text-textColor">
              <li>
                <Link to="/" className="hover:text-primaryColor transition">
                  Donate
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primaryColor transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
