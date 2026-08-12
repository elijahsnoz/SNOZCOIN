import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'

const container = document.getElementById('snoz-universe-canvas')

if (container) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  try {
    createRoot(container).render(
      <ErrorBoundary>
        <App reducedMotion={reducedMotion} />
      </ErrorBoundary>
    )
    window.dispatchEvent(new CustomEvent('snoz-universe:mounted'))
  } catch (error) {
    console.error('SNOZ Universe failed to mount, falling back to 2D:', error)
    window.dispatchEvent(new CustomEvent('snoz-universe:error', { detail: error }))
  }
}
