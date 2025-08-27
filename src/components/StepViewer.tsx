import { useEffect, useRef, useState } from 'react';

type Props = {
  file?: File | null;
  blobUrl?: string;
  fileName?: string;
  height?: number;
};

// Dynamic loader for O3DV browser bundle
async function injectScriptOnce(src: string, attr: Record<string, string> = {}) {
  return new Promise<void>((resolve, reject) => {
    // Als hij al aanwezig is, resolve direct
    const existing = document.querySelector(`script[data-o3dv-src="${src}"]`) as HTMLScriptElement | null;
    if (existing && (window as any).OV) return resolve();

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.dataset.o3dvSrc = src;
    Object.entries(attr).forEach(([k, v]) => s.setAttribute(k, v));

    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`o3dv script load error: ${src}`));

    document.head.appendChild(s);
  });
}

async function ensureO3DVLoaded(): Promise<any> {
  const w = window as any;
  if (w.OV) return w.OV;

  // 1) Bestaat het bestand op de juiste plek?
  const url = '/libs/o3dv/o3dv.min.js'; // LET OP: zonder /public
  const headRes = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  if (!headRes.ok) throw new Error(`o3dv not found at ${url} (HTTP ${headRes.status})`);

  // 2) Injecteer script en wacht op window.OV
  await injectScriptOnce(url, { 'data-o3dv': '1' });

  // 3) Poll kort op window.OV
  const t0 = performance.now();
  return await new Promise<any>((resolve, reject) => {
    (function wait() {
      if ((window as any).OV) return resolve((window as any).OV);
      if (performance.now() - t0 > 8000) return reject(new Error('window.OV not set after o3dv load'));
      requestAnimationFrame(wait);
    })();
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

      // libs-locatie (dit vertelt de viewer waar de importers (WASM) staan)
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