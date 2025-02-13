import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SignIn from './pages/Auth/SignIn'
import SignUp from './pages/Auth/SignUp'
import Home from './pages/Home'
import Cards from './pages/Cards'
import Wallet from './pages/Wallet'
import { useAuthStore } from './store/authStore'

function App() {
  const { loadUser, user, loading } = useAuthStore()

  React.useEffect(() => {
    // Initialize auth session
    loadUser()
  }, [loadUser])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/auth">
        <Route path="signin" element={user ? <Navigate to="/" /> : <SignIn />} />
        <Route path="signup" element={user ? <Navigate to="/" /> : <SignUp />} />
        <Route index element={<Navigate to="/auth/signin" />} />
      </Route>
      <Route path="/" element={user ? <Layout /> : <Navigate to="/auth/signin" />}>
        <Route index element={<Home />} />
        <Route path="cards" element={<Cards />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>
    </Routes>
  )
}

export default App