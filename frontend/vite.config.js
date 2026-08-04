import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API is proxied rather than called at http://localhost:5000 directly.
// backend/server.js mounts no CORS middleware, so a browser on :5173 calling
// :5000 is a cross-origin request the backend never answers — the preflight
// fails and every upload dies before it reaches Express. Proxying keeps the
// request same-origin from the browser's point of view, which needs no
// backend change at all.
const API_TARGET = 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': API_TARGET },
  },
  preview: {
    proxy: { '/api': API_TARGET },
  },
})
