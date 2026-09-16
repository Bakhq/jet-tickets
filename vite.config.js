import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Absolute root base: with BrowserRouter, routes can be several path
  // segments deep (e.g. /organizer/events/123/edit), and a relative base
  // ('./') would resolve asset URLs relative to that deep path instead of
  // the actual asset location. jetona.ru serves this app from the domain
  // root, so '/' is always correct regardless of route depth.
  base: '/',
  plugins: [react(), tailwindcss()],
})
