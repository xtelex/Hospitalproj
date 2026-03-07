import Home from '../pages/Home'
import Services from '../pages/Services'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Contact from '../pages/Contact'
import Doctors from '../pages/Doctors/Doctors'
import DoctorDetails from '../pages/Doctors/DoctorsDetails'
import Profile from '../pages/Profile.jsx'
import PatientDetails from '../pages/PatientDetails.jsx'
import BookVisit from '../pages/BookVisit.jsx'
import Appointments from '../pages/Appointments.jsx'
import LabResults from '../pages/LabResults.jsx'
import Teleconsult from '../pages/Teleconsult.jsx'
import HealthRecords from '../pages/HealthRecords.jsx'
import RequireAuth from '../auth/RequireAuth.jsx'

import { Navigate, Routes, Route } from 'react-router-dom'

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/Register" element={<Navigate to="/register" replace />} />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/patients/:uid"
        element={
          <RequireAuth>
            <PatientDetails />
          </RequireAuth>
        }
      />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />
      <Route
        path="/book"
        element={
          <RequireAuth>
            <BookVisit />
          </RequireAuth>
        }
      />
      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <Appointments />
          </RequireAuth>
        }
      />
      <Route
        path="/lab-results"
        element={
          <RequireAuth>
            <LabResults />
          </RequireAuth>
        }
      />
      <Route
        path="/teleconsult"
        element={
          <RequireAuth>
            <Teleconsult />
          </RequireAuth>
        }
      />
      <Route
        path="/health-records"
        element={
          <RequireAuth>
            <HealthRecords />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default Routers
