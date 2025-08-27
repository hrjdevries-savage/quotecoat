import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import * as THREE from 'three';

// Import OpenCascade.js for STEP file parsing
declare global {
  interface Window {
    opencascade: any;
  }
}

interface StepViewerProps {
  blobUrl: string;
  fileName: string;
}

function StepModel({ blobUrl, fileName, onError }: { blobUrl: string; fileName: string; onError: (error: string | null) => void }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (fileName.toLowerCase().includes('step') || fileName.toLowerCase().includes('stp')) {
          // For now, create a more detailed representative model
          // TODO: Implement actual STEP parsing when a reliable library is available
          console.log('Loading STEP file:', fileName);
          
          // Simulate loading time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const group = new THREE.Group();
          
          // Create a more realistic CAD part representation
          const mainBody = new THREE.BoxGeometry(8, 4, 2);
          const mainMesh = new THREE.Mesh(mainBody, new THREE.MeshStandardMaterial({ 
            color: '#2563eb',
            metalness: 0.7,
            roughness: 0.3
          }));
          group.add(mainMesh);
          
          // Add mounting holes
          const holeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2.2, 16);
          const holeMaterial = new THREE.MeshStandardMaterial({ 
            color: '#1e293b',
            metalness: 0.9,
            roughness: 0.1
          });
          
          // Corner holes
          [-3, 3].forEach(x => {
            [-1.5, 1.5].forEach(y => {
              const hole = new THREE.Mesh(holeGeometry, holeMaterial);
              hole.position.set(x, y, 0);
              hole.rotation.z = Math.PI / 2;
              group.add(hole);
            });
          });
          
          // Add a flange
          const flangeGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 32);
          const flangeMesh = new THREE.Mesh(flangeGeometry, new THREE.MeshStandardMaterial({ 
            color: '#0891b2',
            metalness: 0.8,
            roughness: 0.2
          }));
          flangeMesh.position.set(0, 0, 1.2);
          group.add(flangeMesh);
          
          // Add some detail features
          const channelGeometry = new THREE.BoxGeometry(6, 0.5, 0.3);
          const channelMesh = new THREE.Mesh(channelGeometry, new THREE.MeshStandardMaterial({ 
            color: '#374151',
            metalness: 0.6,
            roughness: 0.4
          }));
          channelMesh.position.set(0, 0, -0.8);
          group.add(channelMesh);
          
          // Add text indicator that this is a preview
          const textPlaneGeometry = new THREE.PlaneGeometry(4, 1);
          const textPlaneMaterial = new THREE.MeshBasicMaterial({ 
            color: '#ffffff',
            transparent: true,
            opacity: 0.8
          });
          const textPlane = new THREE.Mesh(textPlaneGeometry, textPlaneMaterial);
          textPlane.position.set(0, 0, 2);
          textPlane.lookAt(8, 6, 8); // Face the camera
          group.add(textPlane);
          
          setGeometry(group as any);
          const errorMsg = 'Preview model - Echte STEP parsing wordt ontwikkeld';
          setError(errorMsg);
          onError(errorMsg);
        } else {
          throw new Error('Alleen STEP bestanden (.step, .stp) worden ondersteund');
        }
      } catch (err) {
        console.error('Error loading model:', err);
        const errorMsg = err instanceof Error ? err.message : 'Onbekende fout bij laden van model';
        setError(errorMsg);
        onError(errorMsg);
        
        // Fallback to simple error indicator
        const errorGeometry = new THREE.BoxGeometry(2, 2, 2);
        const errorMaterial = new THREE.MeshStandardMaterial({ 
          color: '#ef4444',
          transparent: true,
          opacity: 0.7
        });
        const errorMesh = new THREE.Mesh(errorGeometry, errorMaterial);
        setGeometry(errorMesh as any);
      } finally {
        setLoading(false);
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

  if (loading || !geometry) {
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
  const [modelError, setModelError] = useState<string | null>(null);

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
          <StepModel blobUrl={blobUrl} fileName={fileName} onError={setModelError} />
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
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border max-w-xs">
        📐 3D Preview: {fileName}
        {modelError && <div className="text-amber-600 mt-1">ℹ️ {modelError}</div>}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        🔄 Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
}