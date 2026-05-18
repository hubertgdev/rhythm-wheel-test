import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

let root = document.getElementById('root')
if (!root) {
  root = document.createElement('div')
  root.id = 'root'
  document.appendChild(root)
}

createRoot(root).render(
  <StrictMode>
    <div>Hello React</div>
  </StrictMode>,
)
