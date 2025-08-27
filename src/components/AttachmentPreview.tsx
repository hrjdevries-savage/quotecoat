import { useEffect, useRef, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Attachment } from '@/types';
import { StepViewer } from './StepViewer';
import * as pdfjsLib from 'pdfjs-dist';

interface AttachmentPreviewProps {
  attachment: Attachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttachmentPreview({ attachment, isOpen, onClose }: AttachmentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  const renderPdfPage = async (pdfDoc: any, pageNumber: number, zoomScale: number) => {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoomScale });
      const canvas = canvasRef.current;
      
      if (!canvas) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: canvas.getContext('2d')!,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      console.log('PDF page rendered successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.5);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (!attachment || !isOpen) return;

    const isPDF = attachment.mimeType === 'application/pdf';
  const isCAD = /\.(stp|step)$/i.test(attachment.fileName);

    if (isPDF) {
      console.log('Loading PDF:', attachment.fileName, attachment.mimeType, attachment.blobUrl);
      
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      // Try to load PDF from either blob URL or file directly
      const loadPdf = async () => {
        try {
          let arrayBuffer: ArrayBuffer;
          
          if (attachment.file) {
            // If we have the original file, use it directly
            console.log('Loading PDF from file object');
            arrayBuffer = await attachment.file.arrayBuffer();
          } else if (attachment.blobUrl) {
            // Try to fetch from blob URL
            console.log('Loading PDF from blob URL');
            const response = await fetch(attachment.blobUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
            }
            arrayBuffer = await response.arrayBuffer();
          } else {
            throw new Error('No file data available');
          }
          
          console.log('PDF data size:', arrayBuffer.byteLength);
          
          // Check if it's actually a valid PDF
          const uint8Array = new Uint8Array(arrayBuffer);
          const header = String.fromCharCode.apply(null, Array.from(uint8Array.slice(0, 5)));
          console.log('PDF header:', header);
          
          if (!header.startsWith('%PDF')) {
            throw new Error('Invalid PDF header: ' + header);
          }
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          console.log('PDF loaded successfully, pages:', pdf.numPages);
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          renderPdfPage(pdf, 1, scale);
          
        } catch (error) {
          console.error('Error loading PDF:', error);
          if (pdfContainerRef.current) {
            pdfContainerRef.current.innerHTML = '<p class="text-destructive p-4">Error loading PDF preview: ' + error.message + '</p>';
          }
        }
      };
      
      loadPdf();
    } else if (isCAD && attachment.blobUrl) {
      console.log('Loading STEP/CAD file:', attachment.fileName, attachment.mimeType, attachment.blobUrl);
    }
  }, [attachment, isOpen, scale]);

  useEffect(() => {
    if (pdfDocument && currentPage) {
      renderPdfPage(pdfDocument, currentPage, scale);
    }
  }, [scale, currentPage, pdfDocument]);

  if (!attachment) return null;

  const isPDF = attachment.mimeType === 'application/pdf';
  const isCAD = /\.(stp|step)$/i.test(attachment.fileName);
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
              {/* PDF Controls */}
              <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                  >
                    Vorige
                  </Button>
                  <span className="text-sm font-medium">
                    Pagina {currentPage} van {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    Volgende
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* PDF Canvas */}
              <div className="border rounded-lg overflow-auto bg-white p-4 shadow-inner">
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              </div>
              <div ref={pdfContainerRef} />
            </div>
          )}
          
          {isCAD && (
            <StepViewer
              file={attachment.file ?? null}
              blobUrl={attachment.file ? undefined : attachment.blobUrl}
              fileName={attachment.file ? undefined : attachment.fileName}
              height={600}
            />
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