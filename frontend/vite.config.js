import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const localApiTarget = process.env.VITE_LOCAL_API_TARGET || 'http://localhost:3002'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5188,
    proxy: {
      '/api': {
        target: localApiTarget,
        changeOrigin: true
      }
    }
  }
})
