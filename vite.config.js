import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/winterplan2026/',
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        monthCalendar: resolve(__dirname, 'components/month-calendar.js'),
        weekCalendar: resolve(__dirname, 'components/week-calendar.js')
      }
    }
  }
})
// force rebuild Sun Feb  8 17:53:09 CST 2026
