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

    async function init() {
      // Wacht tot de globale OV bestaat
      const getOV = (): Promise<any> =>
        new Promise((resolve, reject) => {
          const start = Date.now();
          (function check() {
            const OV = (window as any).OV;
            if (OV) return resolve(OV);
            if (Date.now() - start > 5000) return reject(new Error('O3DV not loaded'));
            requestAnimationFrame(check);
          })();
        });

      const OV = await getOV();

      // Deze call is nu geldig, want we gebruiken de browser-bundle:
      if (typeof OV.SetExternalLibLocation === 'function') {
        OV.SetExternalLibLocation('/libs/');
      } else {
        console.warn('OV.SetExternalLibLocation ontbreekt — controleer of /libs/o3dv/o3dv.min.js via <script> is geladen.');
      }

      const el = containerRef.current;
      if (!el) return;
      el.style.minHeight = `${height}px`;

      viewer = new OV.EmbeddedViewer(el, {
        backgroundColor: new OV.RGBAColor(255, 255, 255, 255),
        defaultColor: new OV.RGBColor(200, 200, 200),
        edgeSettings: new OV.EdgeSettings(true, new OV.RGBColor(0, 0, 0), 1),
      });

      // Bronbestand bepalen
      let srcFile = file ?? null;
      if (!srcFile && blobUrl && fileName) {
        const res = await fetch(blobUrl);
        const buf = await res.arrayBuffer();
        srcFile = new File([buf], fileName, { type: 'model/step' });
      }
      if (!srcFile) return;

      // FileList aanmaken
      const dt = new DataTransfer();
      dt.items.add(srcFile);

      // Laden + fitten
      viewer.LoadModelFromFileList(
        dt.files,
        undefined,
        () => viewer && viewer.FitModelToWindow(),
        () => {},
        (err: any) => console.error('STEP load error', err)
      );

      // Fit safeguards (modal/open/resize)
      setTimeout(() => viewer?.FitModelToWindow(), 60);
      const onResize = () => viewer?.FitModelToWindow();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    init().catch(e => console.error('Init O3DV error', e));
    return () => { 
      disposed = true; 
      try { 
        viewer?.Destroy?.(); 
      } catch {} 
    };
  }, [file, blobUrl, fileName, height]);

  return <div ref={containerRef} className="w-full rounded-lg border" style={{ height }} />;
}