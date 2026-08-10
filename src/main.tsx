import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import '@fontsource-variable/manrope'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/global.css'

import { App } from './App'
import { LangProvider } from './state/lang'
import { TableProvider } from './state/table'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Звичайні шляхи, не хеш. Статичний хостинг сам по собі віддав би 404 на
        прямий захід у /MorseWorld/practice, тому збірка кладе на кожен маршрут
        справжній index.html — див. tools/prerender.mjs. Хеш теж працював би, але
        все після `#` для пошукових систем не адреса, а якір: одинадцять
        сторінок склеїлися б в одну й зникли з індексу.

        База приходить із Vite, тому в розробці й у збірці однакова. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LangProvider>
        <TableProvider>
          <App />
        </TableProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
