import { useEffect, useRef } from 'react';

type Props = { 
  file?: File | null; 
  blobUrl?: string; 
  fileName?: string; 
  height?: number; 
};

export function StepViewer({ file, blobUrl, fileName, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let viewer: any | null = null;
    let disposed = false;
    let ro: ResizeObserver | null = null;

    const waitForOV = (): Promise<any> =>
      new Promise((resolve, reject) => {
        const start = performance.now();
        (function check() {
          const OV = (window as any).OV;
          if (OV) return resolve(OV);
          if (performance.now() - start > 5000) return reject(new Error('O3DV not loaded'));
          requestAnimationFrame(check);
        })();
      });

    const waitForLayout = (el: HTMLElement): Promise<void> =>
      new Promise((resolve) => {
        const start = performance.now();
        (function check() {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return resolve();
          if (performance.now() - start > 1500) return resolve(); // fail-soft
          requestAnimationFrame(check);
        })();
      });

    async function init() {
      const el = containerRef.current;
      if (!el) return;

      // 1) Wacht op globale OV (browser-bundle via <script>) en op layout
      const OV = await waitForOV();
      el.style.minHeight = `${height}px`;
      await waitForLayout(el);

      // 2) Stel libs-locatie in en initialiseer viewer
      try {
        if (typeof OV.SetExternalLibLocation === 'function') {
          OV.SetExternalLibLocation('/libs/');
        }
      } catch (e) {
        console.warn('SetExternalLibLocation niet beschikbaar; controleer bundel-load via <script>.', e);
      }

      viewer = new OV.EmbeddedViewer(el, {
        backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
        defaultColor: new OV.RGBColor(200, 200, 200),
        edgeSettings: new OV.EdgeSettings(true, new OV.RGBColor(0, 0, 0), 1),
      });

      // 3) Bronbestand bepalen
      let srcFile = file ?? null;
      if (!srcFile && blobUrl && fileName) {
        const res = await fetch(blobUrl);
        if (!res.ok) throw new Error(`Blob fetch failed: ${res.status} ${res.statusText}`);
        const buf = await res.arrayBuffer();
        srcFile = new File([buf], fileName, { type: 'model/step' });
      }
      if (!srcFile) {
        console.warn('Geen bronbestand voor STEP-viewer.');
        return;
      }

      // 4) FileList maken en laden
      const dt = new DataTransfer();
      dt.items.add(srcFile);

      viewer.LoadModelFromFileList(
        dt.files,
        undefined,
        () => {
          if (disposed) return;
          try {
            viewer.FitModelToWindow();
          } catch (e) {
            console.warn('FitModelToWindow na load faalde:', e);
          }
        },
        (progress: number) => {
          // optioneel: console.log('Import progress', progress);
        },
        (err: any) => {
          console.error('STEP import error', err);
        }
      );

      // 5) Resize handling (Dialog open/resize)
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
      setTimeout(refit, 250); // nog een keer na layout settle
    }

    init().catch((e) => console.error('Init O3DV error', e));

    return () => {
      disposed = true;
      try { ro?.disconnect(); } catch {}
      try { viewer?.Destroy?.(); } catch {}
      window.removeEventListener('resize', () => {});
    };
  }, [file, blobUrl, fileName, height]);

  return <div ref={containerRef} className="w-full rounded-lg border bg-white" style={{ height }} />;
}