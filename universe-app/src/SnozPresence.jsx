import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import heroTextureUrl from './snoz-hero.png'

// SNOZ as a large, always-camera-facing billboard rather than a modeled
// character — the brief asks for a "large SNOZ presence," not a polygon
// budget. Reusing the site's own flat art keeps this consistent with the
// 2D identity instead of introducing a different-looking 3D mascot.
//
// Importing the PNG (rather than a bare './snoz-hero.png' string) matters:
// a plain string is resolved by the browser relative to the HOST page
// (universe.html, at the site root), not relative to this bundle inside
// assets/universe-build/ — that mismatch 404'd in testing. The import lets
// Vite bake in the correct final URL at build time.
export default function SnozPresence({ reducedMotion }) {
  const texture = useTexture(heroTextureUrl)
  const group = useRef()
  const { viewport } = useThree()

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    const bob = reducedMotion ? 0 : Math.sin(t * 0.9) * 0.15
    group.current.position.y = bob

    if (!reducedMotion) {
      const targetRotY = state.pointer.x * 0.25
      const targetRotX = -state.pointer.y * 0.15
      group.current.rotation.y += (targetRotY - group.current.rotation.y) * 0.04
      group.current.rotation.x += (targetRotX - group.current.rotation.x) * 0.04
    }
  })

  const height = Math.min(5.6, viewport.height * 0.62)
  const width = height * (760 / 860)

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}
