import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Orders from './pages/Orders/Orders'
import BlogView from './pages/BlogView/BlogView'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/blog/:shareCode" element={<BlogView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
