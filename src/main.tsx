import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import '@fontsource-variable/manrope'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/global.css'

import { App } from './App'
import { LangProvider } from './state/lang'
import { TableProvider } from './state/table'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Хеш, а не шлях: сайт живе в підкаталозі uz-or.com/MorseWorld/ на
        статиці, яка для неіснуючого файлу віддає 404, а не index.html. При
        BrowserRouter прямий захід на /MorseWorld/practice і перезавантаження
        будь-якої внутрішньої сторінки впали б — з хешем сервер завжди бачить
        лише /MorseWorld/, а решту маршруту розбирає вже застосунок. */}
    <HashRouter>
      <LangProvider>
        <TableProvider>
          <App />
        </TableProvider>
      </LangProvider>
    </HashRouter>
  </StrictMode>,
)
