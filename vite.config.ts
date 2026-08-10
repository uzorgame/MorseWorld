import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // Відносна база: збірка кладеться в підкаталог uz-or.com/MorseWorld/, і
  // абсолютні шляхи на /assets/ шукали б їх у корені домену. Так само зроблено
  // в Poster і Whisper, які лежать там же поруч.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5190,
  },
})
