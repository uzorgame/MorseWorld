import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  /**
   * Сайт живе в підкаталозі uz-or.com/MorseWorld/, тому база не коренева.
   *
   * І не відносна — хоч Poster і Whisper поруч зроблені саме так. Вони
   * односторінкові, а тут кожен маршрут лежить власним файлом: із
   * `/MorseWorld/learn/reading/index.html` відносний `./assets/` шукав би
   * скрипти в `/MorseWorld/learn/reading/assets/`, де їх немає. Абсолютний шлях
   * від бази однаково правильний на будь-якій глибині.
   */
  base: '/MorseWorld/',
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
