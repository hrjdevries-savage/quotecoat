import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

declare global {
  interface Window {
    OV?: {
      Init3DViewerFromUrlList: (el: HTMLElement, urls: any[], params?: any) => any;
      Init3DViewerFromFileList: (el: HTMLElement, files: File[], params?: any) => any;
      RGBAColor: any;
      CameraProjection: any;
    };
  }
}

interface StepViewerProps {
  file?: File | Blob | null;      // lokaal gekozen file (of Blob)
  blobUrl?: string;               // publieke URL (Supabase)
  fileName?: string;
  height?: number;
}

/** Eenvoudige fallback mockup */
function MechanicalPart() {
  return (
    <group>
      <Box args={[3, 0.5, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8A9BA8" metalness={0.6} roughness={0.3} />
      </Box>
      <Cylinder args={[0.6, 0.6, 1.5, 32]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#A5B5C2" metalness={0.6} roughness={0.3} />
      </Cylinder>
      <Sphere args={[0.1]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#B8C5D1" metalness={0.5} roughness={0.4} />
      </Sphere>
    </group>
  );
}

export function StepViewer({ file, blobUrl, fileName = 'model.step', height = 400 }: StepViewerProps) {
  const o3dvRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>();
  const viewerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);
  const [debug, setDebug]     = useState<string | null>(null);

  // Helper: zorg dat bestandsnaam eindigt op .stp/.step (O3DV kijkt naar extensie)
  function normalizeName(name?: string) {
    const n = (name || 'model.step').toLowerCase();
    if (n.endsWith('.stp') || n.endsWith('.step')) return name || 'model.step';
    // als geen extensie → forceer .stp
    return (name || 'model') + '.stp';
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Reset UI flags
      setLoading(true);
      setFailed(false);
      setDebug(null);

      // 1) OV aanwezig?
      if (!window.OV) {
        setDebug('window.OV ontbreekt (script niet geladen?)');
        setFailed(true);
        setLoading(false);
        return;
      }
      if (!o3dvRef.current) {
        setDebug('container ontbreekt');
        setFailed(true);
        setLoading(false);
        return;
      }

      try {
        // 2) Container schoon
        o3dvRef.current.innerHTML = '';

        // 3) Basis params + callbacks
        const params = {
          backgroundColor: window.OV.RGBAColor ? new window.OV.RGBAColor(245, 245, 245, 255) : undefined,
          edgeSettings: { showEdges: true },
          camera: window.OV.CameraProjection?.Perspective ? { projection: window.OV.CameraProjection.Perspective } : undefined,
          onModelLoaded: () => {
            if (!mounted) return;
            console.log('[O3DV] Model loaded');
            setLoading(false);
            setFailed(false);
            setDebug(null);
            try { viewerRef.current?.FitModelToWindow?.(); } catch {}
          },
          onModelLoadFailed: () => {
            if (!mounted) return;
            console.warn('[O3DV] Model load failed');
            // Niet meteen falen; we proberen nog een alternatieve URL-route
            setDebug('O3DV: onModelLoadFailed');
            // We laten hieronder nog een tweede poging toe (URL-variant)
          }
        };

        let viewer: any = null;

        // 4) File pad
        if (file) {
          const fname = normalizeName(fileName);
          const f = file instanceof File ? file : new File([file], fname, { type: 'application/octet-stream' });
          console.log('[O3DV] Load from FileList:', fname);
          viewer = window.OV.Init3DViewerFromFileList(o3dvRef.current, [f], params);
          viewerRef.current = viewer;
          // Wachten op callbacks; we returnen hier zodat callbacks de state zetten
          return;
        }

        // 5) URL pad – twee pogingen
        if (blobUrl) {
          // a) String-URL
          const url1 = encodeURI(blobUrl);
          console.log('[O3DV] Load from URL (string):', url1);
          viewer = window.OV.Init3DViewerFromUrlList(o3dvRef.current, [url1], params);
          viewerRef.current = viewer;

          // Wacht even; als onModelLoaded niet triggert binnen korte tijd,
          // probeer named-variant (sommige setups zijn daar kieskeurig over)
          setTimeout(() => {
            if (!mounted) return;
            // Als hij al geladen is (loading=false) → niets doen
            if (!loading) return;

            try {
              // b) Named entry
              const fname = normalizeName(fileName);
              const named = { url: url1, name: fname };
              console.log('[O3DV] Retry with named URL entry:', named);
              o3dvRef.current!.innerHTML = '';
              viewer = window.OV.Init3DViewerFromUrlList(o3dvRef.current!, [named], params);
              viewerRef.current = viewer;
            } catch (err) {
              console.error('[O3DV] Named URL retry failed', err);
            }
          }, 600);

          return;
        }

        // 6) Geen bron
        throw new Error('Geen bestand of URL');
      } catch (e: any) {
        console.error('[O3DV] init error:', e);
        if (!mounted) return;
        setDebug(`init error: ${e?.message || e}`);
        setFailed(true);
        setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [file, blobUrl, fileName]);

  // Resize (houd canvas passend)
  useEffect(() => {
    function onResize() { try { viewerRef.current?.Resize?.(); } catch {} }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleFit = () => {
    try { viewerRef.current?.FitModelToWindow?.(); }
    catch { controlsRef.current?.reset?.(); }
  };

  const handleZoom = (factor: number) => {
    if (controlsRef.current) {
      const cam = controlsRef.current.object;
      cam.position.multiplyScalar(factor);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border" style={{ height }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleZoom(0.8)} className="bg-white/90 backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleZoom(1.25)} className="bg-white/90 backdrop-blur-sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleFit} className="bg-white/90 backdrop-blur-sm">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* File label */}
      {fileName && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium">
          {normalizeName(fileName)}
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mb-4 mx-auto"></div>
            <p className="text-gray-600">STEP/STP laden…</p>
          </div>
        </div>
      )}

      {/* O3DV container – ALTIJD aanwezig */}
      <div ref={o3dvRef} className="w-full h-full" />

      {/* Fallback alleen bij failure */}
      {failed && (
        <>
          <Canvas camera={{ position: [5, 5, 5], fov: 50 }} className="w-full h-full">
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
            </mesh>
            <MechanicalPart />
            <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate />
          </Canvas>
          {/* klein debug-lintje zodat jij weet waarom mockup getoond wordt */}
          {debug && (
            <div className="absolute bottom-2 left-2 z-30 bg-yellow-200/90 text-yellow-900 text-xs px-2 py-1 rounded">
              CAD fallback: {debug}
            </div>
          )}
        </>
      )}
    </div>
  );
}