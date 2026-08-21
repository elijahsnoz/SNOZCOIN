import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import modelUrl from './snoz-3d.glb'

// SNOZ as a real generated mesh (image-to-3D from the site's own hero art)
// rather than a flat billboard. The GLB carries baked vertex colors and no
// material, so the color/metalness fix below is required for it to render
// visibly under App.jsx's scene lighting.
export default function SnozPresence({ reducedMotion }) {
  const { scene } = useGLTF(modelUrl)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    // The GLB ships no material (just baked vertex colors), so GLTFLoader
    // falls back to its default fully-metallic material — with no
    // environment map that reads as near-black regardless of vertex color.
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone()
        child.material.metalness = 0
        child.material.roughness = 0.85
        child.material.vertexColors = true
      }
    })
    return clone
  }, [scene])
  const group = useRef()
  const { viewport } = useThree()

  // The export's own bounds/pivot aren't guaranteed to be centered, so
  // measure and re-center at runtime instead of hardcoding an offset.
  const { center, unitScale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    return { center: box.getCenter(new THREE.Vector3()), unitScale: 1 / Math.max(size.y, 0.0001) }
  }, [model])

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
  const scale = height * unitScale

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive
        object={model}
        scale={scale}
        rotation={[0, Math.PI, 0]}
        position={[center.x * scale, -center.y * scale, center.z * scale]}
      />
    </group>
  )
}

useGLTF.preload(modelUrl)
