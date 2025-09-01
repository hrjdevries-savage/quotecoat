export interface StepAnalysisRequest {
  file_url: string;
  material?: string;
  density_kg_m3?: number;
}

export interface StepAnalysisResponse {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  solids: number;
  volume_m3: number;
}

export class StepAnalyzerService {
  private static readonly API_BASE = 'https://step-analyzer.onrender.com';
  
  static async analyzeStepFile(request: StepAnalysisRequest): Promise<StepAnalysisResponse> {
    try {
      console.log('Calling STEP Analyzer API:', request);
      
      const response = await fetch(`${this.API_BASE}/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`STEP analysis failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('STEP analysis result:', result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing STEP file:', error);
      throw error;
    }
  }

  static isStepFile(fileName: string): boolean {
    return /\.(step|stp)$/i.test(fileName);
  }
}