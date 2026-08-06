import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The API is proxied rather than called at http://localhost:5000 directly.
// backend/server.js mounts no CORS middleware, so a browser on :5173 calling
// :5000 is a cross-origin request the backend never answers — the preflight
// fails and every upload dies before it reaches Express. Proxying keeps the
// request same-origin from the browser's point of view, which needs no
// backend change at all.
const DEFAULT_API_TARGET = 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded with an empty prefix so this one is readable without a VITE_
  // name. That matters: VITE_ variables are inlined into client code, and
  // this is a dev-server setting the browser has no business seeing.
  //
  // It exists because backend/.env can move the API off 5000 via PORT, and a
  // proxy pinned to 5000 would then point at nothing while the app still
  // looked correctly configured.
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.DEV_API_TARGET || DEFAULT_API_TARGET

  return {
    plugins: [react()],
    server: {
      proxy: { '/api': target },
    },
    preview: {
      proxy: { '/api': target },
    },
  }
})
