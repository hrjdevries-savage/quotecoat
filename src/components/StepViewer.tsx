import { useEffect, useRef, useState } from 'react';

interface StepViewerProps {
  file?: File | null;
  blobUrl?: string;
  fileName?: string;
  height?: number;
}

export function StepViewer({ file, blobUrl, fileName, height = 600 }: StepViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let viewer: any | null = null;
    let disposed = false;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Wait for window.OV to be available
        const getOV = (): Promise<any> =>
          new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
              if ((window as any).OV) return resolve((window as any).OV);
              if (Date.now() - start > 5000) return reject(new Error('O3DV not loaded within 5 seconds'));
              requestAnimationFrame(check);
            };
            check();
          });

        const OV = await getOV();
        console.log('Online3DViewer loaded via window.OV');

        // Set external lib location for WASM assets
        OV.SetExternalLibLocation('/libs/');

        // Container must have visible dimensions
        if (!containerRef.current) return;
        containerRef.current.style.minHeight = `${height}px`;

        // Initialize viewer
        viewer = new OV.EmbeddedViewer(containerRef.current, {
          backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
          defaultColor: new OV.RGBColor(200, 200, 200),
          edgeSettings: new OV.EdgeSettings(true, new OV.RGBColor(0, 0, 0), 1),
        });

        // Determine source file
        let srcFile: File | null = file ?? null;
        if (!srcFile && blobUrl && fileName) {
          const res = await fetch(blobUrl);
          if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
          const buf = await res.arrayBuffer();
          srcFile = new File([buf], fileName, { type: 'model/step' });
        }
        if (!srcFile) {
          setError('Geen bestand beschikbaar');
          setLoading(false);
          return;
        }

        console.log('Loading STEP file:', srcFile.name);

        // Create FileList for the loader
        const dt = new DataTransfer();
        dt.items.add(srcFile);

        // Load model and fit
        viewer.LoadModelFromFileList(
          dt.files,
          undefined,
          () => {
            // Success callback
            if (!disposed) {
              console.log('STEP file loaded successfully');
              viewer.FitModelToWindow();
              setLoading(false);
            }
          },
          (progress: number) => {
            // Progress callback
            console.log('Loading progress:', progress);
          },
          (err: any) => {
            // Error callback
            console.error('STEP load error:', err);
            if (!disposed) {
              setError('Fout bij laden van STEP bestand: ' + (err?.message || 'Onbekende fout'));
              setLoading(false);
            }
          }
        );

        // Resize/Modal open safeguards
        const fit = () => {
          if (!disposed) {
            try {
              viewer.FitModelToWindow();
            } catch (e) {
              // Ignore errors during fitting
            }
          }
        };
        
        setTimeout(fit, 60);
        const resizeHandler = () => fit();
        window.addEventListener('resize', resizeHandler);
        
        return () => {
          window.removeEventListener('resize', resizeHandler);
        };

      } catch (initError) {
        console.error('Error initializing viewer:', initError);
        if (!disposed) {
          setError('Fout bij initialiseren van 3D viewer: ' + (initError instanceof Error ? initError.message : 'Onbekende fout'));
          setLoading(false);
        }
      }
    }

    if (containerRef.current) {
      init().catch((e) => console.error('Init O3DV error', e));
    }

    return () => {
      disposed = true;
      try {
        viewer?.Destroy?.();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [file, blobUrl, fileName, height]);

  return (
    <div className="w-full border rounded-lg bg-background overflow-hidden relative" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-muted-foreground">STEP bestand laden...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm text-destructive">{error}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Zorg ervoor dat de O3DV en WASM libraries in /public/libs/ staan
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border max-w-xs">
        📐 3D Preview: {fileName || 'STEP bestand'}
      </div>
      
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        🔄 Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
}