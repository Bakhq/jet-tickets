import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { getProfile } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap the current session once, then keep it in sync with every
  // sign-in/sign-out/token-refresh Supabase's client reports.
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  // The profiles row (role, name, company) is fetched separately since it
  // lives in its own table — re-fetch whenever the signed-in user changes.
  useEffect(() => {
    let active = true
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      return
    }
    getProfile(userId)
      .then((p) => active && setProfile(p))
      .catch(() => active && setProfile(null))
    return () => {
      active = false
    }
  }, [session?.user?.id])

  const signUp = async ({ email, password, fullName, role, companyName }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          company_name: companyName || null,
        },
      },
    })
    if (error) throw error
  }

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Redirects the whole page to Google's consent screen; control never
  // returns to the caller on success — Supabase brings the visitor back to
  // redirectTo with the session already established, and onAuthStateChange
  // above picks it up from there. redirectTo must be listed under Redirect
  // URLs in the Supabase Auth settings or Supabase will reject it.
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    })
    if (error) throw error
  }

  // Sends a "reset your password" email. The link inside brings the visitor
  // back to redirectTo with a temporary recovery session already established
  // (same detectSessionInUrl mechanism as Google sign-in above) — the
  // /auth/reset page then calls updatePassword() below to finish the job.
  // redirectTo must be listed under Redirect URLs in the Supabase Auth
  // settings or Supabase will reject it.
  const sendPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) throw error
  }

  // Sets a new password for whoever is in the current session. Only safe to
  // call once a recovery session is active (see /auth/reset), since it acts
  // on "the current user", not a specific email/token pair.
  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    isOrganizer: profile?.role === 'organizer',
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
