import Header from '../components/Header/header'
import Footer from '../components/Header/Footer/footer'
import Routers from '../Routes/Routers'
import { useLocation } from 'react-router-dom'
import ScrollTransitions from '../components/ScrollTransitions/ScrollTransitions'

const Layout = () => {
  const location = useLocation()
  const hideFooter = location.pathname.startsWith('/doctors/')
  return (
    <div className="app-bg min-h-screen">
      <ScrollTransitions />
      <Header />
      <main className="relative pt-[72px]">
        <Routers />
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}

export default Layout
