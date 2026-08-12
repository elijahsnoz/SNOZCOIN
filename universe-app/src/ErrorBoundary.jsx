import { Component } from 'react'

// If anything inside the 3D scene throws at runtime (a lost WebGL context,
// a texture failing to decode, etc.) we want to fail back to the static 2D
// hub that's still sitting underneath in the DOM — not a blank canvas or a
// crashed page. See main.jsx for what happens with this event.
export default class ErrorBoundary extends Component {
  componentDidCatch(error) {
    console.error('SNOZ Universe 3D scene crashed, falling back to 2D:', error)
    window.dispatchEvent(new CustomEvent('snoz-universe:error', { detail: error }))
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
