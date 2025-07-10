import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // plus de proxy ici, on laisse vide ou on supprime même 'server' si pas besoin d'autres configs
  },
})
