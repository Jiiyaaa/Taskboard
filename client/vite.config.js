import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the browser talks to Vite, which forwards /api to the Express server,
// so no CORS setup is needed locally. In production VITE_API_URL points at the hosted API.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
})
