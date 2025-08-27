import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

interface StepViewerProps {
  file?: File | null;
  blobUrl?: string;
  fileName?: string;
  height?: number;
}

// Simple mechanical part mockup with bright, visible colors
function MechanicalPart() {
  return (
    <group>
      {/* Main body - rectangular base */}
      <Box args={[3, 0.5, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8A9BA8" metalness={0.6} roughness={0.3} />
      </Box>
      
      {/* Cylindrical feature */}
      <Cylinder args={[0.6, 0.6, 1.5, 32]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#A5B5C2" metalness={0.6} roughness={0.3} />
      </Cylinder>
      
      {/* Holes */}
      <Cylinder args={[0.2, 0.2, 0.6, 16]} position={[-1, 0.25, 0.6]}>
        <meshStandardMaterial color="#5A6B78" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 0.6, 16]} position={[1, 0.25, 0.6]}>
        <meshStandardMaterial color="#5A6B78" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 0.6, 16]} position={[-1, 0.25, -0.6]}>
        <meshStandardMaterial color="#5A6B78" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 0.6, 16]} position={[1, 0.25, -0.6]}>
        <meshStandardMaterial color="#5A6B78" metalness={0.8} roughness={0.2} />
      </Cylinder>
      
      {/* Small details */}
      <Sphere args={[0.1]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#B8C5D1" metalness={0.5} roughness={0.4} />
      </Sphere>
      
      {/* Side features */}
      <Box args={[0.3, 0.3, 0.8]} position={[1.65, 0.4, 0]}>
        <meshStandardMaterial color="#95A6B3" metalness={0.6} roughness={0.3} />
      </Box>
      <Box args={[0.3, 0.3, 0.8]} position={[-1.65, 0.4, 0]}>
        <meshStandardMaterial color="#95A6B3" metalness={0.6} roughness={0.3} />
      </Box>
    </group>
  );
}

export function StepViewer({ file, blobUrl, fileName, height = 400 }: StepViewerProps) {
  const controlsRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [file, blobUrl]);

  const handleFitToWindow = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      camera.position.multiplyScalar(1.25);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border" style={{ height }}>
      {/* Viewer Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleFitToWindow}
          className="bg-white/90 backdrop-blur-sm"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* File info */}
      {fileName && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium">
          {fileName}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mb-4 mx-auto"></div>
            <p className="text-gray-600">STEP-bestand laden...</p>
            <p className="text-sm text-gray-500 mt-1">Mockup demonstratie</p>
          </div>
        </div>
      )}

      {/* 3D Viewer */}
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        className="w-full h-full"
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.3}
        />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
        </mesh>

        {/* Mechanical part */}
        <MechanicalPart />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-gray-600">
        <div className="flex gap-4">
          <span>🖱️ Slepen: Roteren</span>
          <span>⚇ Scrollen: Zoomen</span>
          <span>⇧ Shift+Slepen: Pannen</span>
        </div>
      </div>
    </div>
  );
}