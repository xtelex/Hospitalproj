import logo from '../../assets/images/medikill.png'
import { NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider.jsx'

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { user, signOutUser } = useAuth()
  const navLinks = [
    { path: user ? '/home' : '/', display: 'Home' },
    { path: '/doctors', display: 'Find a Doctor' },
    { path: '/services', display: 'Services' },
    { path: '/contact', display: 'Contact' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        // Use fixed to avoid `position: sticky` being broken by transforms/overflow on ancestors.
        'fixed top-0 inset-x-0 z-[100] border-b transition-all duration-200',
        scrolled ? 'bg-white/80 backdrop-blur shadow-sm border-white/30' : 'bg-white border-[#d9e8f5]',
      ].join(' ')}
    >
      <div className="container">
        <div className="h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src={logo} alt="MediKill logo" className="w-8 h-8 object-contain" />

            <ul className="menu flex items-center gap-8">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      isActive
                        ? 'text-primaryColor text-[16px] leading-7 font-[600]'
                        : 'text-textColor text-[16px] leading-7 font-[500] hover:text-primaryColor'
                    }
                  >
                    {link.display}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account'}
                    className="w-9 h-9 rounded-full object-cover border border-[#d9e8f5]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#EAF3FB] border border-[#d9e8f5]" />
                )}
                <span className="hidden md:block text-[14px] font-[700] text-headingColor">
                  {user.displayName || user.email}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => signOutUser()}
                className="px-4 py-2.5 rounded-md border border-[#e7eff7] bg-white text-[14px] font-[800] text-headingColor hover:border-primaryColor transition"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primaryColor text-white px-6 py-2.5 rounded-md text-[16px] font-[600] hover:bg-sky-700"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
