import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "leaflet/dist/leaflet.css";
import './index.css'
import App from './App.jsx'

// Debug: confirm Vite loaded env at startup
console.log("[VITE DEBUG] VITE_API_URL at startup:", import.meta.env.VITE_API_URL);
console.log("[VITE DEBUG] MODE:", import.meta.env.MODE);

// Restore persisted theme before first paint
const savedTheme = localStorage.getItem('df-theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
