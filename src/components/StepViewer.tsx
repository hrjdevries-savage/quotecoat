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

function StepModel({ blobUrl, fileName }: { blobUrl: string; fileName: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOpenCascade = async () => {
      try {
        // Load OpenCascade.js library dynamically
        if (!window.opencascade) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/opencascade.js@latest/dist/opencascade.wasm.js';
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          // Initialize OpenCascade
          window.opencascade = await (window as any).OpenCascade();
        }
        
        return window.opencascade;
      } catch (err) {
        console.error('Failed to load OpenCascade.js:', err);
        throw err;
      }
    };

    const loadModel = async () => {
      setLoading(true);
      try {
        if (fileName.toLowerCase().includes('step') || fileName.toLowerCase().includes('stp')) {
          // Try to parse actual STEP file
          const oc = await loadOpenCascade();
          
          // Fetch the STEP file
          const response = await fetch(blobUrl);
          const arrayBuffer = await response.arrayBuffer();
          const fileData = new Uint8Array(arrayBuffer);
          
          // Create a virtual file in OpenCascade's filesystem
          const fileName_virtual = '/step_file.step';
          oc.FS.writeFile(fileName_virtual, fileData);
          
          // Read STEP file
          const reader = new oc.STEPCAFControl_Reader_1();
          const readResult = reader.ReadFile(fileName_virtual);
          
          if (readResult === oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
            reader.TransferRoots();
            const doc = new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1());
            reader.Transfer(doc);
            
            // Get the shape
            const shapeTool = oc.XCAFDoc_DocumentTool.ShapeTool(doc.Main()).get();
            const colorTool = oc.XCAFDoc_DocumentTool.ColorTool(doc.Main()).get();
            
            const labels = new oc.TDF_LabelSequence_1();
            shapeTool.GetFreeShapes(labels);
            
            const group = new THREE.Group();
            
            for (let i = 1; i <= labels.Length(); i++) {
              const label = labels.Value(i);
              const shape = shapeTool.GetShape(label);
              
              if (!shape.IsNull()) {
                // Triangulate the shape
                const triangulation = new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);
                
                // Extract triangles
                const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
                
                const vertices: number[] = [];
                const indices: number[] = [];
                let vertexIndex = 0;
                
                while (explorer.More()) {
                  const face = oc.TopoDS.Face_1(explorer.Current());
                  const location = new oc.TopLoc_Location_1();
                  const triangulation_face = oc.BRep_Tool.Triangulation(face, location);
                  
                  if (!triangulation_face.IsNull()) {
                    const nodes = triangulation_face.get().Nodes();
                    const triangles = triangulation_face.get().Triangles();
                    
                    // Add vertices
                    for (let j = 1; j <= nodes.Length(); j++) {
                      const node = nodes.Value(j);
                      vertices.push(node.X(), node.Y(), node.Z());
                    }
                    
                    // Add triangles
                    for (let j = 1; j <= triangles.Length(); j++) {
                      const triangle = triangles.Value(j);
                      let n1, n2, n3;
                      triangle.Get(n1, n2, n3);
                      indices.push(
                        vertexIndex + n1 - 1,
                        vertexIndex + n2 - 1,
                        vertexIndex + n3 - 1
                      );
                    }
                    
                    vertexIndex += nodes.Length();
                  }
                  
                  explorer.Next();
                }
                
                if (vertices.length > 0) {
                  const geometry = new THREE.BufferGeometry();
                  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                  geometry.setIndex(indices);
                  geometry.computeVertexNormals();
                  
                  const material = new THREE.MeshStandardMaterial({ 
                    color: '#4f46e5',
                    side: THREE.DoubleSide 
                  });
                  const mesh = new THREE.Mesh(geometry, material);
                  group.add(mesh);
                }
              }
            }
            
            // Cleanup
            oc.FS.unlink(fileName_virtual);
            
            if (group.children.length > 0) {
              setGeometry(group as any);
            } else {
              throw new Error('Geen geometrie gevonden in STEP bestand');
            }
          } else {
            throw new Error('Kon STEP bestand niet lezen');
          }
        } else {
          // Fallback for non-STEP files
          throw new Error('Alleen STEP bestanden worden ondersteund');
        }
      } catch (err) {
        console.error('Error loading STEP model:', err);
        // Fallback to representative model
        const group = new THREE.Group();
        
        const mainGeometry = new THREE.BoxGeometry(4, 2, 1);
        const mainMesh = new THREE.Mesh(mainGeometry, new THREE.MeshStandardMaterial({ color: '#ef4444' }));
        group.add(mainMesh);
        
        // Add error indicator
        const textGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshStandardMaterial({ color: '#ffffff' }));
        textMesh.position.set(0, 1.5, 0);
        group.add(textMesh);
        
        setGeometry(group as any);
        setError(err instanceof Error ? err.message : 'Kon STEP bestand niet laden');
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
  const [viewerError, setViewerError] = useState<string | null>(null);

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
        {viewerError && <div className="text-destructive mt-1">⚠️ {viewerError}</div>}
      </div>
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        🔄 Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
}