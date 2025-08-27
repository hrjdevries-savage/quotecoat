import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';

interface StepViewerProps {
  blobUrl: string;
  fileName: string;
}

function StepModel({ blobUrl, fileName }: { blobUrl: string; fileName: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [error, setError] = useState<string | null>(null);

  // For now, we'll show a placeholder 3D object since STEP file parsing is complex
  // In a real implementation, you'd need a STEP file loader
  
  return (
    <Center>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#4f46e5" wireframe />
      </mesh>
      <mesh position={[3, 0, 0]}>
        <cylinderGeometry args={[1, 1, 2]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[1]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    </Center>
  );
}

export function StepViewer({ blobUrl, fileName }: StepViewerProps) {
  return (
    <div className="w-full h-96 border rounded-lg bg-background overflow-hidden">
      <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#666" />
          </mesh>
        }>
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <StepModel blobUrl={blobUrl} fileName={fileName} />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        3D Preview: {fileName}
      </div>
    </div>
  );
}