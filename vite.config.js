import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base задаётся переменной VITE_BASE.
// Для обычной сборки это '/', для версии «с флешки» - './' (см. npm run build:offline).
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
