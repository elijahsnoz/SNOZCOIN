import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { PORTALS } from './portal-data'

function PortalNode({ portal, position, reducedMotion }) {
  const mesh = useRef()
  const [hovered, setHovered] = useState(false)
  const isLive = Boolean(portal.href)

  useFrame((_, delta) => {
    if (!mesh.current || reducedMotion) return
    mesh.current.rotation.x += delta * 0.15
    mesh.current.rotation.y += delta * 0.2
  })

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        scale={hovered && isLive ? 1.25 : 1}
        onPointerOver={() => {
          if (!isLive) return
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={() => {
          if (isLive) window.location.href = portal.href
        }}
      >
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={portal.color}
          emissive={portal.color}
          emissiveIntensity={isLive ? (hovered ? 1.4 : 0.8) : 0.15}
          transparent
          opacity={isLive ? 1 : 0.35}
          wireframe={!isLive}
        />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            fontFamily: "'Space Grotesk', monospace",
            fontSize: '11px',
            letterSpacing: '1px',
            textAlign: 'center',
            color: isLive ? '#f4ff3a' : 'rgba(169,166,173,0.8)',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
            transform: 'translateY(28px)',
          }}
        >
          {portal.num} — {portal.name.toUpperCase()}
          <br />
          <span style={{ opacity: 0.75 }}>{isLive ? 'ENTER →' : 'IN DEVELOPMENT'}</span>
        </div>
      </Html>
    </group>
  )
}

export default function Portals({ reducedMotion }) {
  const radius = 5.4
  return (
    <group>
      {PORTALS.map((portal, i) => {
        const angle = (i / PORTALS.length) * Math.PI * 2
        const position = [Math.cos(angle) * radius, Math.sin(i * 1.3) * 0.6, Math.sin(angle) * radius]
        return <PortalNode key={portal.num} portal={portal} position={position} reducedMotion={reducedMotion} />
      })}
    </group>
  )
}
