import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import GuestPage from './pages/GuestPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/guest/:id" element={<GuestPage />} />
      </Routes>
    </BrowserRouter>
  )
}
