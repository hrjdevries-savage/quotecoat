import { useEffect, useRef, useState } from 'react';

type Props = {
  file?: File | null;
  blobUrl?: string;
  fileName?: string;
  height?: number;
};

// Dynamic loader for O3DV browser bundle
function ensureO3DVLoaded(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).OV) {
      return resolve((window as any).OV);
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src="/libs/o3dv/o3dv.min.js"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if ((window as any).OV) {
          return resolve((window as any).OV);
        }
        setTimeout(checkLoaded, 100);
      };
      checkLoaded();
      return;
    }

    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/libs/o3dv/o3dv.min.css';
    document.head.appendChild(cssLink);

    // Load JS
    const script = document.createElement('script');
    script.src = '/libs/o3dv/o3dv.min.js';
    script.async = false;
    
    script.onload = () => {
      // Poll for OV to be available
      const checkOV = () => {
        if ((window as any).OV) {
          console.log('[O3DV] Loaded successfully');
          resolve((window as any).OV);
        } else {
          setTimeout(checkOV, 50);
        }
      };
      checkOV();
    };

    script.onerror = () => {
      reject(new Error('Failed to load /libs/o3dv/o3dv.min.js - check if file exists in /public/libs/o3dv/'));
    };

    document.head.appendChild(script);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!(window as any).OV) {
        reject(new Error('O3DV load timeout - window.OV not available after 10s'));
      }
    }, 10000);
  });
}

export function StepViewer({ file, blobUrl, fileName, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState('init');

  useEffect(() => {
    let viewer: any | null = null;
    let disposed = false;
    let ro: ResizeObserver | null = null;

    const log = (msg: string, ...args: any[]) => {
      setStatus(msg);
      console.log('[StepViewer]', msg, ...args);
    };

    const waitForLayout = (el: HTMLElement): Promise<void> =>
      new Promise((resolve) => {
        (function tick() {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return resolve();
          requestAnimationFrame(tick);
        })();
      });

    async function getSrcFile(): Promise<File | null> {
      if (file) {
        log('file: using provided File', { name: file.name, size: file.size });
        return file;
      }
      if (blobUrl && fileName) {
        log('file: fetching from blobUrl', { blobUrl, fileName });
        const res = await fetch(blobUrl);
        if (!res.ok) throw new Error(`Blob fetch failed: ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();
        const f = new File([buf], fileName, { type: 'model/step' });
        log('file: created File from blob', { name: f.name, size: f.size });
        return f;
      }
      return null;
    }

    async function loadFromFile(OV: any, src: File) {
      // Gebruik FileList route
      const dt = new DataTransfer();
      dt.items.add(src);
      log('viewer: LoadModelFromFileList start', { name: src.name });

      viewer!.LoadModelFromFileList(
        dt.files,
        undefined,
        () => {
          if (disposed) return;
          log('viewer: import success → FitModelToWindow');
          try {
            viewer!.FitModelToWindow();
          } catch (e) {
            console.warn('FitModelToWindow failed', e);
          }
        },
        (progress: number) => {
          // progress 0..100
          // log('import progress', progress);
        },
        (err: any) => {
          console.error('STEP import error', err);
          log('viewer: import error (see console)');
        }
      );
    }

    async function loadFallbackUrl(OV: any) {
      // Fallback om rendering te testen zónder upload
      // Zet een testbestand neer: /public/samples/test.step
      const url = '/samples/test.step';
      log('viewer: fallback LoadModelFromUrlList', { url });
      const files = [{ url, name: 'test.step' }];

      try {
        viewer!.LoadModelFromUrlList(
          files as any,
          undefined,
          () => {
            if (disposed) return;
            log('viewer: fallback import success → FitModelToWindow');
            try {
              viewer!.FitModelToWindow();
            } catch {}
          },
          (progress: number) => {
            // log('fallback progress', progress);
          },
          (err: any) => {
            console.error('fallback import error', err);
            log('viewer: fallback import error (see console)');
          }
        );
      } catch (e) {
        console.error('fallback call failed', e);
        log('viewer: fallback call threw (see console)');
      }
    }

    async function init() {
      const el = containerRef.current;
      if (!el) return;

      // Dynamically ensure O3DV is loaded
      setStatus('loading O3DV…');
      const OV = await ensureO3DVLoaded();
      log('O3DV loaded successfully');

      // libs-locatie
      if (typeof OV.SetExternalLibLocation === 'function') {
        OV.SetExternalLibLocation('/libs/');
        log('OV.SetExternalLibLocation(/libs/) set');
      } else {
        log('OV.SetExternalLibLocation missing');
      }

      // layout
      el.style.minHeight = `${height}px`;
      await waitForLayout(el);
      const r0 = el.getBoundingClientRect();
      log('layout ready', { width: r0.width, height: r0.height });

      // viewer init
      viewer = new OV.EmbeddedViewer(el, {
        backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
        defaultColor: new OV.RGBColor(200, 200, 200),
        edgeSettings: new OV.EdgeSettings(true, new OV.RGBColor(0, 0, 0), 1)
      });
      log('viewer created');

      // bron laden
      try {
        const src = await getSrcFile();
        if (src) {
          await loadFromFile(OV, src);
        } else {
          log('no source file → using fallback URL');
          await loadFallbackUrl(OV);
        }
      } catch (e) {
        console.error('load source failed', e);
        log('load source failed; trying fallback URL');
        await loadFallbackUrl(OV);
      }

      // resize/fits
      const refit = () => {
        if (!viewer) return;
        try {
          viewer.Resize();
          viewer.FitModelToWindow();
        } catch {}
      };
      ro = new ResizeObserver(refit);
      ro.observe(el);
      window.addEventListener('resize', refit);
      setTimeout(refit, 80);
      setTimeout(refit, 250);
    }

    init().catch((e) => {
      console.error('Init O3DV error', e);
      setStatus('Init failed: ' + (e as Error).message);
    });

    return () => {
      disposed = true;
      try { ro?.disconnect(); } catch {}
      try { viewer?.Destroy?.(); } catch {}
      window.removeEventListener('resize', () => {});
    };
  }, [file, blobUrl, fileName, height]);

  return (
    <div className="w-full rounded-lg border bg-white relative" style={{ height }} ref={containerRef}>
      <div className="absolute top-1 right-2 text-xs text-muted-foreground bg-white/80 rounded px-2 py-1">
        {status}
      </div>
    </div>
  );
}