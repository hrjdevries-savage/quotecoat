import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';

interface StepViewerProps {
  blobUrl: string;
  fileName: string;
}

function StepModel({ blobUrl, fileName }: { blobUrl: string; fileName: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        // For STEP files, we'll show a representative 3D model
        // Real STEP parsing would require specialized libraries
        
        if (fileName.toLowerCase().includes('step') || fileName.toLowerCase().includes('stp')) {
          // Create a more complex representative model for STEP files
          const group = new THREE.Group();
          
          // Main body (could represent machined part)
          const mainGeometry = new THREE.BoxGeometry(4, 2, 1);
          const mainMesh = new THREE.Mesh(mainGeometry, new THREE.MeshStandardMaterial({ color: '#4f46e5' }));
          group.add(mainMesh);
          
          // Add some holes/features
          const holeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16);
          const holeMaterial = new THREE.MeshStandardMaterial({ color: '#1f2937' });
          
          const hole1 = new THREE.Mesh(holeGeometry, holeMaterial);
          hole1.position.set(-1.5, 0, 0);
          hole1.rotation.z = Math.PI / 2;
          group.add(hole1);
          
          const hole2 = new THREE.Mesh(holeGeometry, holeMaterial);
          hole2.position.set(1.5, 0, 0);
          hole2.rotation.z = Math.PI / 2;
          group.add(hole2);
          
          // Add mounting flange
          const flangeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
          const flangeMesh = new THREE.Mesh(flangeGeometry, new THREE.MeshStandardMaterial({ color: '#06b6d4' }));
          flangeMesh.position.set(0, 0, 0.7);
          group.add(flangeMesh);
          
          setGeometry(group as any);
        }
      } catch (err) {
        console.error('Error loading 3D model:', err);
        setError('Kon 3D model niet laden');
      }
    };

    loadModel();
  }, [blobUrl, fileName]);

  if (error) {
    return (
      <Center>
        <mesh>
          <boxGeometry args={[2, 1, 0.1]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </Center>
    );
  }

  if (!geometry) {
    return (
      <Center>
        <mesh rotation={[0, Date.now() * 0.001, 0]}>
          <torusGeometry args={[1, 0.3, 16, 100]} />
          <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
      </Center>
    );
  }

  return (
    <Center>
      {geometry instanceof THREE.Group ? (
        <primitive object={geometry} />
      ) : (
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
      )}
    </Center>
  );
}

export function StepViewer({ blobUrl, fileName }: StepViewerProps) {
  return (
    <div className="w-full h-96 border rounded-lg bg-background overflow-hidden relative">
      <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[0.5]} />
            <meshBasicMaterial color="#666" wireframe />
          </mesh>
        }>
          <Environment preset="studio" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <StepModel blobUrl={blobUrl} fileName={fileName} />
          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
            maxDistance={20}
            minDistance={2}
          />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        📐 3D Preview: {fileName}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        🔄 Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
}