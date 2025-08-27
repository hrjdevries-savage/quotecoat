import { useEffect, useRef, useState } from 'react';

interface StepViewerProps {
  blobUrl: string;
  fileName: string;
  file?: File;
}

export function StepViewer({ blobUrl, fileName, file }: StepViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let viewer: any = null;
    let OV: any = null;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Import Online3DViewer
        OV = await import('online-3d-viewer');
        console.log('Online3DViewer loaded');

        // Set external lib location for WASM assets
        OV.SetExternalLibLocation('/libs/');

        // Initialize viewer
        viewer = new OV.EmbeddedViewer(containerRef.current!, {
          backgroundColor: new OV.RGBAColor(248, 249, 250, 255),
          defaultColor: new OV.RGBColor(100, 149, 237),
          edgeSettings: { showEdges: true }
        });

        // Load the STEP file if available
        if (file) {
          console.log('Loading STEP file:', fileName);
          const buffer = new Uint8Array(await file.arrayBuffer());
          const files = [new OV.InputFile(fileName, buffer)];
          const params = new OV.ImportParameters();
          params.defaultColor = new OV.RGBColor(100, 149, 237);

          viewer.LoadModelFromFileList(
            files, 
            params, 
            () => {
              // Success callback
              console.log('STEP file loaded successfully');
              viewer.FitModelToWindow();
              setLoading(false);
            },
            (progress: number) => {
              // Progress callback
              console.log('Loading progress:', progress);
            },
            (err: any) => {
              // Error callback
              console.error('STEP load error:', err);
              setError('Fout bij laden van STEP bestand: ' + (err?.message || 'Onbekende fout'));
              setLoading(false);
            }
          );
        } else if (blobUrl) {
          // Fallback: try to fetch from blob URL
          try {
            const response = await fetch(blobUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            const files = [new OV.InputFile(fileName, buffer)];
            const params = new OV.ImportParameters();
            params.defaultColor = new OV.RGBColor(100, 149, 237);

            viewer.LoadModelFromFileList(
              files,
              params,
              () => {
                console.log('STEP file loaded successfully from blob');
                viewer.FitModelToWindow();
                setLoading(false);
              },
              (progress: number) => {
                console.log('Loading progress:', progress);
              },
              (err: any) => {
                console.error('STEP load error:', err);
                setError('Fout bij laden van STEP bestand: ' + (err?.message || 'Onbekende fout'));
                setLoading(false);
              }
            );
          } catch (fetchError) {
            console.error('Error fetching blob:', fetchError);
            setError('Fout bij ophalen van bestand');
            setLoading(false);
          }
        } else {
          setError('Geen bestand beschikbaar');
          setLoading(false);
        }
      } catch (initError) {
        console.error('Error initializing viewer:', initError);
        setError('Fout bij initialiseren van 3D viewer: ' + (initError?.message || 'Onbekende fout'));
        setLoading(false);
      }
    }

    if (containerRef.current) {
      init();
    }

    return () => {
      if (viewer && viewer.Clear) {
        viewer.Clear();
      }
    };
  }, [file, blobUrl, fileName]);

  return (
    <div className="w-full h-96 border rounded-lg bg-background overflow-hidden relative">
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
              Zorg ervoor dat de WASM libraries in /public/libs/ staan
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border max-w-xs">
        📐 3D Preview: {fileName}
      </div>
      
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded border">
        🔄 Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
}