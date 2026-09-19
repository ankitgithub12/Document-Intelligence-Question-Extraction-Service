import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DI</span>
            </div>
            <span className="font-semibold text-lg gradient-text">DocIntel</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/documents" className="text-dark-300 hover:text-white transition-colors text-sm font-medium">
              Documents
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-dark-400 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-200 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
