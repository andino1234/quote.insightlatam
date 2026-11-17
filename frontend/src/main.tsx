/**
 * Sistema de Cotizaciones — punto de entrada del frontend (React).
 *
 * @author Ariel Geovanny Andino Chinchilla
 * @see    https://github.com/andino1234
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
