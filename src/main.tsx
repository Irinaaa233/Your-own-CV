import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/resume-template.css'
import './styles/a4-layout.css'
import './index.css'
import { printResume } from './utils/print'

if (typeof window !== 'undefined') {
  // Intercept Cmd/Ctrl+P so the custom print flow is used even on keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault()
      printResume()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
