import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles } from '@react-three/drei'
import SnozPresence from './SnozPresence'
import Portals from './Portals'

// Narrow viewport is a proxy for "phone, probably weaker GPU than desktop"
// even after the WebGL + hardwareConcurrency capability gate in
// universe.html has already filtered out devices that can't handle 3D at
// all. This trims particle counts further for the ones that remain.
const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 768

export default function App({ reducedMotion }) {
  const starCount = reducedMotion ? 500 : isNarrowViewport ? 900 : 2200
  const sparkles = !reducedMotion

  return (
    <Canvas
      camera={{ position: [0, 1.2, 9.5], fov: 50 }}
      dpr={[1, isNarrowViewport ? 1.5 : Math.min(2, window.devicePixelRatio || 1)]}
      gl={{ antialias: !isNarrowViewport, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#07060a']} />
      <fog attach="fog" args={['#07060a', 6, 20]} />

      <ambientLight intensity={0.4} />
      <pointLight position={[6, 4, 6]} intensity={40} color="#ff3d81" />
      <pointLight position={[-6, -2, -4]} intensity={30} color="#34e5ff" />
      <pointLight position={[0, 3, 4]} intensity={20} color="#f4ff3a" />

      <Stars radius={40} depth={30} count={starCount} factor={2.2} saturation={0} fade speed={reducedMotion ? 0 : 0.4} />
      {sparkles && (
        <>
          <Sparkles count={isNarrowViewport ? 35 : 80} scale={9} size={2.5} speed={0.25} color="#f4ff3a" opacity={0.6} />
          {!isNarrowViewport && <Sparkles count={60} scale={11} size={2} speed={0.2} color="#34e5ff" opacity={0.5} />}
        </>
      )}

      <Suspense fallback={null}>
        <SnozPresence reducedMotion={reducedMotion} />
      </Suspense>
      <Portals reducedMotion={reducedMotion} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.7}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.5}
        rotateSpeed={0.4}
      />
    </Canvas>
  )
}
