import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import MainLayout from './components/MainLayout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard'
import Medicines from './pages/Medicines'
import Inbound from './pages/Inbound'
import Outbound from './pages/Outbound'
import Settings from './pages/Settings'

function App() {
  const token = useAuthStore(state => state.token)

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/" element={token ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="medicines" element={<Medicines />} />
        <Route path="inbound" element={<Inbound />} />
        <Route path="outbound" element={<Outbound />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
