import logo from '../../assets/images/medikill.png'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { FiBell, FiMenu, FiX } from 'react-icons/fi'

import { useAuth } from '../../auth/AuthProvider.jsx'
import { getProfilePhotoForUser } from '../../data/profileStore'
import { getDoctorAppointments, getDoctorIdForUser, getRoleForUser, splitPastUpcoming } from '../../data/appointmentsStore'
import {
  ensureAppointmentReminders,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../data/notificationsStore'
import { getDoctorDirectoryEntry } from '../../data/doctorsDirectory'

function Header() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const { user, signOutUser } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const role = user?.uid ? getRoleForUser(user.uid) : 'patient'
  const doctorId = user?.uid && role === 'doctor' ? getDoctorIdForUser(user.uid) : ''
  const doctorEntry = role === 'doctor' && doctorId ? getDoctorDirectoryEntry(doctorId) : null

  const localPhoto = user?.uid ? getProfilePhotoForUser(user.uid) : ''
  const effectiveName = doctorEntry?.name || user?.displayName || user?.email || 'Account'
  const avatarSrc = doctorEntry?.photo || localPhoto || user?.photoURL || ''

  const notifRecipient = useMemo(() => {
    if (!user?.uid) return null
    if (role === 'doctor' && doctorId) return { type: 'doctor', id: doctorId }
    return { type: 'user', id: user.uid }
  }, [user?.uid, role, doctorId])

  const unreadCount = useMemo(() => {
    if (!notifRecipient) return 0
    return getUnreadCount(notifRecipient.type, notifRecipient.id)
  }, [notifRecipient, refreshTick])

  const notifItems = useMemo(() => {
    if (!notifRecipient) return []
    return listNotifications(notifRecipient.type, notifRecipient.id).slice(0, 8)
  }, [notifRecipient, refreshTick])

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

  useEffect(() => {
    // Close menus on navigation.
    setNotifOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!user?.uid) return
    const id = setInterval(() => setRefreshTick((t) => t + 1), 4000)
    return () => clearInterval(id)
  }, [user?.uid])

  useEffect(() => {
    if (role !== 'doctor' || !doctorId) return
    const { upcoming } = splitPastUpcoming(getDoctorAppointments(doctorId))
    ensureAppointmentReminders({ doctorId, upcomingAppointments: upcoming })
  }, [role, doctorId, refreshTick])

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-[100] border-b transition-all duration-200',
        scrolled ? 'bg-white/80 backdrop-blur shadow-sm border-white/30' : 'bg-white border-[#d9e8f5]',
      ].join(' ')}
    >
      <div className="container">
        <div className="h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <img src={logo} alt="MediKill logo" className="w-8 h-8 object-contain shrink-0" />

            <ul className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.path}>
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                {notifRecipient && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        setNotifOpen((v) => !v)
                      }}
                      className="w-10 h-10 rounded-full border border-[#e7eff7] bg-white grid place-items-center text-headingColor hover:border-primaryColor transition relative"
                      aria-label="Notifications"
                    >
                      <FiBell className="text-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b42318] text-white text-[11px] font-[900] grid place-items-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[#e7eff7] bg-white shadow-[rgba(17,12,46,0.12)_0px_18px_50px_0px] overflow-hidden z-[200]">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#eef4fb]">
                          <p className="font-[900] text-headingColor">Notifications</p>
                          <button
                            type="button"
                            onClick={() => {
                              markAllNotificationsRead(notifRecipient.type, notifRecipient.id)
                              setRefreshTick((t) => t + 1)
                            }}
                            className="text-[12px] font-[900] text-primaryColor hover:underline"
                          >
                            Mark all read
                          </button>
                        </div>
                        <div className="max-h-[340px] overflow-y-auto">
                          {notifItems.length === 0 ? (
                            <p className="px-4 py-4 text-[13px] text-textColor">No notifications yet.</p>
                          ) : (
                            notifItems.map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  markNotificationRead(notifRecipient.type, notifRecipient.id, n.id)
                                  setRefreshTick((t) => t + 1)
                                }}
                                className={[
                                  'w-full text-left px-4 py-3 border-b border-[#f0f6fd] hover:bg-[#fbfdff] transition',
                                  n.read ? 'opacity-80' : '',
                                ].join(' ')}
                              >
                                <p className="text-[13px] font-[900] text-headingColor">{n.title || 'Notification'}</p>
                                {!!n.body && <p className="mt-1 text-[12px] text-textColor line-clamp-2">{n.body}</p>}
                                <p className="mt-1 text-[11px] text-textColor">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-3 bg-[#fbfdff]">
                          <button
                            type="button"
                            onClick={() => setNotifOpen(false)}
                            className="w-full h-10 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Link to="/profile" className="flex items-center gap-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={effectiveName}
                      className="w-9 h-9 rounded-full object-cover border border-[#d9e8f5]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#EAF3FB] border border-[#d9e8f5]" />
                  )}
                  <span className="hidden md:block text-[14px] font-[700] text-headingColor max-w-[240px] truncate">
                    {effectiveName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-md border border-[#e7eff7] bg-white text-[14px] font-[800] text-headingColor hover:border-primaryColor transition"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex bg-primaryColor text-white px-6 py-2.5 rounded-md text-[16px] font-[600] hover:bg-sky-700"
              >
                Log In
              </Link>
            )}

            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-full border border-[#e7eff7] bg-white grid place-items-center text-headingColor hover:border-primaryColor transition"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => {
                setNotifOpen(false)
                setMobileOpen((v) => !v)
              }}
            >
              {mobileOpen ? <FiX className="text-[18px]" /> : <FiMenu className="text-[18px]" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[140] bg-black/40" onClick={() => setMobileOpen(false)} role="presentation">
          <div
            className="absolute right-4 top-[84px] w-[min(92vw,420px)] rounded-2xl border border-[#e7eff7] bg-white shadow-[rgba(17,12,46,0.20)_0px_40px_120px_0px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile menu"
          >
            <div className="px-4 py-3 border-b border-[#eef4fb] flex items-center justify-between">
              <p className="font-[900] text-headingColor">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="h-9 px-3 rounded-xl border border-[#e7eff7] bg-white font-[900] text-headingColor hover:border-primaryColor transition"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-2">
              {navLinks.map((l) => (
                <NavLink
                  key={l.path}
                  to={l.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'block px-4 py-3 rounded-xl border font-[900] transition',
                      isActive
                        ? 'bg-primaryColor text-white border-primaryColor'
                        : 'bg-white text-headingColor border-[#e7eff7] hover:border-primaryColor',
                    ].join(' ')
                  }
                >
                  {l.display}
                </NavLink>
              ))}

              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl border border-[#e7eff7] bg-white text-headingColor font-[900] hover:border-primaryColor transition"
                  >
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      signOutUser()
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl bg-primaryColor text-white font-[900] hover:bg-sky-700 transition text-center"
                >
                  Log In
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

