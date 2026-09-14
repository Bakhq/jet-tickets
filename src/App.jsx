import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import EventDetail from './pages/EventDetail.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Account from './pages/Account.jsx'
import Organizer from './pages/Organizer.jsx'
import EventCreate from './pages/EventCreate.jsx'
import Auth from './pages/Auth.jsx'
import { useAuth } from './context/AuthContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-sm text-muted">Загрузка…</div>
    </div>
  )
}

// Any signed-in account can view its own tickets/profile.
function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />
  return children
}

// The organizer dashboard additionally requires the profile's role to be
// 'organizer' — set at signup (see Auth.jsx) and enforced server-side by
// the events/ticket_tiers RLS policies in supabase/schema.sql either way.
function RequireOrganizer({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />
  if (profile && profile.role !== 'organizer') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/confirmation" element={<OrderConfirmation />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
        <Route
          path="/organizer"
          element={
            <RequireOrganizer>
              <Organizer />
            </RequireOrganizer>
          }
        />
        <Route
          path="/organizer/events/new"
          element={
            <RequireOrganizer>
              <EventCreate />
            </RequireOrganizer>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}
