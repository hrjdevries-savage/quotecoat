const DEFAULT_BASE = "https://step-analyzer.onrender.com";
const ANALYZER_BASE_URL = import.meta.env.VITE_ANALYZER_BASE_URL || DEFAULT_BASE;
const ANALYZE_PATH = "/analyze";
const MATERIAL_DEFAULT = "steel";

export interface StepAnalysisResult {
  L: number;
  B: number; 
  H: number;
  W: number;
  solids: number;
  volume_m3: number;
}

export interface StepAnalysisResponse {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  solids?: number;
  volume_m3?: number;
}

function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export async function analyzeStepByUrl(
  fileUrl: string, 
  material?: string, 
  density?: number
): Promise<StepAnalysisResult> {
  // Use /analyze-url endpoint for public URLs
  const body = {
    file_url: encodeURI(fileUrl),
    material: material ?? MATERIAL_DEFAULT,
    density_kg_m3: density ?? null,
  };

  let lastError: Error | null = null;
  
  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const res = await fetch(`${ANALYZER_BASE_URL}/analyze-url`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-Analyzer-Client": "Lovable/Quotecoat" 
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        let errorMessage = `Analyzer returned ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            errorMessage += `: ${errorData.detail}`;
          }
        } catch {
          errorMessage += `: ${res.statusText}`;
        }
        
        if (res.status === 429 || res.status >= 500) {
          throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
      }
      
      const j: StepAnalysisResponse = await res.json();
      
      // Validate response has required numeric fields
      const requiredFields = ["length_mm", "width_mm", "height_mm", "weight_kg"];
      const hasValidFields = requiredFields.every(field => 
        typeof j[field] === "number" && !isNaN(j[field])
      );
      
      if (!hasValidFields) {
        throw new Error("Analyzer response invalid - missing or invalid numeric fields");
      }
      
      // Sort dimensions L >= B >= H for consistency
      const dims = [j.length_mm, j.width_mm, j.height_mm]
        .map(Number)
        .sort((a, b) => b - a);
      
      return {
        L: round3(dims[0]),
        B: round3(dims[1]), 
        H: round3(dims[2]),
        W: round4(Number(j.weight_kg)),
        solids: Number(j.solids ?? 0),
        volume_m3: Number(j.volume_m3 ?? 0)
      };
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (error instanceof Error && 
          !error.message.includes('429') && 
          !error.message.includes('5') &&
          !error.name.includes('AbortError')) {
        throw error;
      }
      
      // Exponential backoff: wait 1s, 2s, 4s
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  
  throw lastError || new Error("Analyzer request failed after retries");
}

export async function analyzeStepByFile(
  file: File, 
  material?: string, 
  density?: number
): Promise<StepAnalysisResult> {
  let lastError: Error | null = null;
  
  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('material', material ?? MATERIAL_DEFAULT);
      if (density !== null && density !== undefined) {
        formData.append('density_kg_m3', density.toString());
      }
      
      const res = await fetch(`${ANALYZER_BASE_URL}${ANALYZE_PATH}`, {
        method: "POST",
        headers: { 
          "X-Analyzer-Client": "Lovable/Quotecoat" 
          // Don't set Content-Type for FormData - browser sets it automatically with boundary
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        let errorMessage = `Analyzer returned ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage += `: ${errorData.detail.map(d => d.msg).join(', ')}`;
            } else {
              errorMessage += `: ${errorData.detail}`;
            }
          }
        } catch {
          errorMessage += `: ${res.statusText}`;
        }
        
        if (res.status === 429 || res.status >= 500) {
          throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
      }
      
      const j: StepAnalysisResponse = await res.json();
      
      // Validate response has required numeric fields
      const requiredFields = ["length_mm", "width_mm", "height_mm", "weight_kg"];
      const hasValidFields = requiredFields.every(field => 
        typeof j[field] === "number" && !isNaN(j[field])
      );
      
      if (!hasValidFields) {
        throw new Error("Analyzer response invalid - missing or invalid numeric fields");
      }
      
      // Sort dimensions L >= B >= H for consistency
      const dims = [j.length_mm, j.width_mm, j.height_mm]
        .map(Number)
        .sort((a, b) => b - a);
      
      return {
        L: round3(dims[0]),
        B: round3(dims[1]), 
        H: round3(dims[2]),
        W: round4(Number(j.weight_kg)),
        solids: Number(j.solids ?? 0),
        volume_m3: Number(j.volume_m3 ?? 0)
      };
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (error instanceof Error && 
          !error.message.includes('429') && 
          !error.message.includes('5') &&
          !error.name.includes('AbortError')) {
        throw error;
      }
      
      // Exponential backoff: wait 1s, 2s, 4s
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  
  throw lastError || new Error("Analyzer request failed after retries");
}

// Helper to convert Blob to File if needed
export function ensureFile(fileOrBlob: File | Blob, fileName: string): File {
  if (fileOrBlob instanceof File) {
    return fileOrBlob;
  }
  return new File([fileOrBlob], fileName, { type: fileOrBlob.type });
}

export function isStepFile(filename: string): boolean {
  return /\.(step|stp)$/i.test(filename);
}

export function parseNumberLoose(str: string): number {
  if (!str) return 0;
  // Replace comma with dot for decimal parsing
  const normalized = str.replace(',', '.');
  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
}

export function formatNumberLocale(n: number, decimals: number = 3): string {
  return n.toLocaleString('nl-NL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// Demo STEP URL for testing
export const DEMO_STEP_URL = "https://github.com/FreeCAD/FreeCAD-library/raw/master/Mechanical%20Parts/Fasteners/Bolts/Hexagon%20head%20bolt/M8x20.step";

export const MATERIALS = [
  { value: "steel", label: "Steel" },
  { value: "aluminum", label: "Aluminum" },
  { value: "stainless", label: "Stainless Steel" },
  { value: "brass", label: "Brass" },
  { value: "copper", label: "Copper" },
  { value: "plastic", label: "Plastic" }
] as const;