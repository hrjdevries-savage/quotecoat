import { useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Attachment } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';

interface AttachmentPreviewProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttachmentPreview({ attachment, isOpen, onClose }: AttachmentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!attachment || !isOpen) return;

    const isPDF = attachment.mimeType === 'application/pdf';
    const isCAD = /\.(step|stp|iges|igs|stl|obj|3ds|fbx|dxf)$/i.test(attachment.fileName);

    if (isPDF && attachment.blobUrl) {
      console.log('Loading PDF:', attachment.fileName, attachment.mimeType, attachment.blobUrl);
      
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      pdfjsLib.getDocument(attachment.blobUrl).promise.then((pdf) => {
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        return pdf.getPage(1);
      }).then((page) => {
        console.log('First page loaded');
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas ref not available');
          return;
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: canvas.getContext('2d')!,
          viewport: viewport
        };
        
        page.render(renderContext).promise.then(() => {
          console.log('PDF rendered successfully');
        });
      }).catch((error) => {
        console.error('Error loading PDF:', error);
        if (pdfContainerRef.current) {
          pdfContainerRef.current.innerHTML = '<p class="text-destructive p-4">Error loading PDF preview: ' + error.message + '</p>';
        }
      });
    } else if (isCAD && attachment.blobUrl) {
      console.log('Loading STEP/CAD file:', attachment.fileName, attachment.mimeType, attachment.blobUrl);
      
      const container = pdfContainerRef.current;
      if (!container) return;
      
      // For STEP files, we need to convert blob URL to a publicly accessible URL
      // Since Online3DViewer needs direct file access, we'll use a different approach
      container.innerHTML = `
        <div class="w-full h-96 border rounded-lg bg-background relative overflow-hidden">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center space-y-4">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p class="text-sm text-muted-foreground">Loading 3D model...</p>
            </div>
          </div>
          <iframe 
            src="https://3dviewer.net/embed.html#model=${encodeURIComponent(attachment.blobUrl)}"
            width="100%" 
            height="100%"
            frameborder="0"
            style="border-radius: 8px;"
            onload="console.log('3D viewer loaded')"
            onerror="console.error('Failed to load 3D viewer')"
          />
        </div>
      `;
      
      // Alternative: Use local Three.js viewer if Online3DViewer doesn't work with blob URLs
      // We could implement a local STEP file viewer using Three.js STEPLoader
    }
  }, [attachment, isOpen]);

  if (!attachment) return null;

  const isPDF = attachment.mimeType === 'application/pdf';
  const isCAD = /\.(step|stp|iges|igs|stl|obj|3ds|fbx|dxf)$/i.test(attachment.fileName);
  const isImage = attachment.mimeType.startsWith('image/');

  const handleDownload = () => {
    if (attachment.blobUrl) {
      const a = document.createElement('a');
      a.href = attachment.blobUrl;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[70vh]">
          {isPDF && (
            <div className="space-y-4">
              <canvas ref={canvasRef} className="w-full border rounded-lg" />
              <div ref={pdfContainerRef} />
            </div>
          )}
          
          {isCAD && (
            <div className="space-y-4">
              <div ref={pdfContainerRef} className="w-full h-96 border rounded-lg flex items-center justify-center bg-muted/30">
                <p className="text-muted-foreground">Loading 3D preview...</p>
              </div>
            </div>
          )}
          
          {isImage && attachment.blobUrl && (
            <img 
              src={attachment.blobUrl} 
              alt={attachment.fileName}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
            />
          )}
          
          {!isPDF && !isCAD && !isImage && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="text-center">
                <p className="font-medium">{attachment.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  Preview niet beschikbaar voor dit bestandstype
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Grootte: {(attachment.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Type: {attachment.mimeType} | PDF: {isPDF.toString()} | CAD: {isCAD.toString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}