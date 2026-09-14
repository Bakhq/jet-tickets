import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Doesn't throw — the app still renders so the rest of the UI (and this
  // message) is visible even before a project is wired up. See SETUP.md.
  console.warn(
    '[Jet] Supabase is not configured yet. Copy .env.example to .env and fill in ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — see SETUP.md.'
  )
}

// A placeholder URL/key lets createClient succeed even when unconfigured,
// so importing this module never crashes the app at boot.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
