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
import Scan from './pages/Scan.jsx'
import Admin from './pages/Admin.jsx'
import Auth from './pages/Auth.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import About from './pages/About.jsx'
import Careers from './pages/Careers.jsx'
import Contacts from './pages/Contacts.jsx'
import Pricing from './pages/Pricing.jsx'
import Refund from './pages/Refund.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import NotFound from './pages/NotFound.jsx'
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

// /admin is gated on profiles.is_admin, not the organizer role — it's the
// site admin (Bakh) confirming SBP/bank-transfer payments, not an organizer
// managing their own events. Enforced again server-side by the
// list_pending_orders_admin / confirm_manual_payment RPCs either way.
function RequireAdmin({ children }) {
  const { session, profile, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/auth" replace state={{ from: location }} />
  if (profile && !isAdmin) return <Navigate to="/" replace />
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
        <Route
          path="/organizer/events/:id/edit"
          element={
            <RequireOrganizer>
              <EventCreate />
            </RequireOrganizer>
          }
        />
        <Route
          path="/organizer/scan"
          element={
            <RequireOrganizer>
              <Scan />
            </RequireOrganizer>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
