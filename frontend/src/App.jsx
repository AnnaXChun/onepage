import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Orders from './pages/Orders/Orders'
import BlogView from './pages/BlogView/BlogView'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/blog/:shareCode" element={<BlogView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
