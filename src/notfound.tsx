import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { PreferencesProvider } from './context/PreferencesProvider'
import { NotFoundApp } from './pages/NotFound/NotFoundApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <NotFoundApp />
    </PreferencesProvider>
  </StrictMode>,
)
