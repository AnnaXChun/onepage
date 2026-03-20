import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Orders from './pages/Orders/Orders'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
