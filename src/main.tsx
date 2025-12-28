import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css' // Asegúrate de tener este archivo o comenta esta línea si no usas CSS global aún

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)