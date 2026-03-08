import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

function Leg({ position, color = '#5b3b27' }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.08, 0.45, 0.08]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
    </mesh>
  )
}

function SofaModel() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[2.45, 0.55, 1.05]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, -0.33]} castShadow>
        <boxGeometry args={[2.45, 0.5, 0.26]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.7} />
      </mesh>
      <mesh position={[-1.15, 0.75, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 1.0]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.65} />
      </mesh>
      <mesh position={[1.15, 0.75, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 1.0]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.65} />
      </mesh>
      <mesh position={[-0.55, 0.88, 0.08]} castShadow>
        <boxGeometry args={[0.52, 0.18, 0.5]} />
        <meshStandardMaterial color="#c4b5fd" roughness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.88, 0.08]} castShadow>
        <boxGeometry args={[0.52, 0.18, 0.5]} />
        <meshStandardMaterial color="#c4b5fd" roughness={0.8} />
      </mesh>
      <Leg position={[-1.05, 0.1, -0.4]} />
      <Leg position={[1.05, 0.1, -0.4]} />
      <Leg position={[-1.05, 0.1, 0.4]} />
      <Leg position={[1.05, 0.1, 0.4]} />
    </group>
  )
}

function BedModel() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.25, 0.4, 1.55]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.57, 0]} castShadow>
        <boxGeometry args={[2.1, 0.1, 1.4]} />
        <meshStandardMaterial color="#ddd6fe" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, -0.62]} castShadow>
        <boxGeometry args={[2.1, 0.45, 0.16]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.75} />
      </mesh>
      <mesh position={[-0.52, 0.67, -0.2]} castShadow>
        <boxGeometry args={[0.62, 0.1, 0.3]} />
        <meshStandardMaterial color="#f5f3ff" roughness={0.95} />
      </mesh>
      <mesh position={[0.52, 0.67, -0.2]} castShadow>
        <boxGeometry args={[0.62, 0.1, 0.3]} />
        <meshStandardMaterial color="#f5f3ff" roughness={0.95} />
      </mesh>
      <Leg position={[-0.95, 0.1, -0.65]} />
      <Leg position={[0.95, 0.1, -0.65]} />
      <Leg position={[-0.95, 0.1, 0.65]} />
      <Leg position={[0.95, 0.1, 0.65]} />
    </group>
  )
}

function DeskModel() {
  return (
    <group>
      <mesh position={[0, 0.84, 0]} castShadow>
        <boxGeometry args={[2.0, 0.14, 0.95]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.55} />
      </mesh>
      <mesh position={[0.73, 0.5, 0.02]} castShadow>
        <boxGeometry args={[0.45, 0.62, 0.86]} />
        <meshStandardMaterial color="#5e3b20" roughness={0.55} />
      </mesh>
      <mesh position={[0.73, 0.68, 0.02]} castShadow>
        <boxGeometry args={[0.4, 0.03, 0.75]} />
        <meshStandardMaterial color="#7a4f2b" roughness={0.55} />
      </mesh>
      <Leg position={[-0.8, 0.3, -0.38]} color="#5e3b20" />
      <Leg position={[-0.8, 0.3, 0.38]} color="#5e3b20" />
      <Leg position={[0.2, 0.3, -0.38]} color="#5e3b20" />
      <Leg position={[0.2, 0.3, 0.38]} color="#5e3b20" />
    </group>
  )
}

function BookshelfModel() {
  return (
    <group>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[1.5, 2.1, 0.45]} />
        <meshStandardMaterial color="#7a4f2b" roughness={0.6} />
      </mesh>
      {[0.38, 0.78, 1.18, 1.58].map((y) => (
        <mesh key={y} position={[0, y, 0.23]} castShadow>
          <boxGeometry args={[1.34, 0.05, 0.02]} />
          <meshStandardMaterial color="#5e3b20" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0.23]} castShadow>
        <boxGeometry args={[1.34, 0.05, 0.02]} />
        <meshStandardMaterial color="#5e3b20" roughness={0.6} />
      </mesh>
    </group>
  )
}

function WardrobeModel() {
  return (
    <group>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.65, 2.3, 0.6]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.58} />
      </mesh>
      <mesh position={[-0.38, 1.15, 0.31]} castShadow>
        <boxGeometry args={[0.72, 2.15, 0.02]} />
        <meshStandardMaterial color="#6f4427" roughness={0.58} />
      </mesh>
      <mesh position={[0.38, 1.15, 0.31]} castShadow>
        <boxGeometry args={[0.72, 2.15, 0.02]} />
        <meshStandardMaterial color="#6f4427" roughness={0.58} />
      </mesh>
      <mesh position={[-0.04, 1.15, 0.33]} castShadow>
        <boxGeometry args={[0.02, 2.05, 0.01]} />
        <meshStandardMaterial color="#4b2e1a" roughness={0.52} />
      </mesh>
    </group>
  )
}

function ChairModel() {
  return (
    <group>
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.9, 0.15, 0.9]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.95, -0.35]} castShadow>
        <boxGeometry args={[0.9, 0.75, 0.14]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.72} />
      </mesh>
      <Leg position={[-0.35, 0.22, -0.35]} />
      <Leg position={[0.35, 0.22, -0.35]} />
      <Leg position={[-0.35, 0.22, 0.35]} />
      <Leg position={[0.35, 0.22, 0.35]} />
    </group>
  )
}

function FallbackFurniture({ type }) {
  if (type === 'bed') return <BedModel />
  if (type === 'desk') return <DeskModel />
  if (type === 'bookshelf') return <BookshelfModel />
  if (type === 'wardrobe') return <WardrobeModel />
  if (type === 'chair') return <ChairModel />
  return <SofaModel />
}

function FurnitureModel({ modelUrl, type, modelScale = 1 }) {
  const [sceneObject, setSceneObject] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loader = new GLTFLoader()

    if (!modelUrl) {
      setSceneObject(null)
      return () => {
        cancelled = true
      }
    }

    loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) return
        const clone = gltf.scene.clone(true)
        const box = new THREE.Box3().setFromObject(clone)
        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x || 1, size.y || 1, size.z || 1)
        const scale = (1.95 / maxDim) * Math.max(0.65, Math.min(3.2, modelScale))
        clone.scale.setScalar(scale)

        const recenterBox = new THREE.Box3().setFromObject(clone)
        const center = new THREE.Vector3()
        recenterBox.getCenter(center)
        clone.position.sub(center)
        clone.position.y += 0.78

        setSceneObject(clone)
      },
      undefined,
      () => {
        if (!cancelled) setSceneObject(null)
      }
    )

    return () => {
      cancelled = true
    }
  }, [modelUrl, modelScale])

  return (
    <group>
      {sceneObject ? <primitive object={sceneObject} /> : <FallbackFurniture type={type} />}
    </group>
  )
}

export default function ARFurniturePreview({ type, modelUrl, modelScale = 1 }) {
  const camera = useMemo(() => ({ position: [0, 1.7, 3.8], fov: 40 }), [])

  return (
    <Canvas
      className="w-full h-full"
      camera={camera}
      gl={{ alpha: true, antialias: true }}
      shadows
    >
      <ambientLight intensity={0.72} />
      <directionalLight castShadow position={[2.5, 4, 2]} intensity={1.2} />
      <directionalLight position={[-2.4, 3, -2]} intensity={0.45} />
      <FurnitureModel modelUrl={modelUrl} type={type} modelScale={modelScale} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.18} />
      </mesh>
    </Canvas>
  )
}




