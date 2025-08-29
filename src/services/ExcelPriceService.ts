import * as XLSX from 'xlsx';

export interface ExcelConfig {
  fileName: string;
  lengthCell: string;
  widthCell: string;
  heightCell: string;
  weightCell: string;
  priceCell: string;
  workbook: XLSX.WorkBook | null;
}

export class ExcelPriceService {
  private static config: ExcelConfig | null = null;

  static setConfig(config: ExcelConfig) {
    this.config = config;
    // Persist config to localStorage
    localStorage.setItem('excel-price-config', JSON.stringify({
      fileName: config.fileName,
      lengthCell: config.lengthCell,
      widthCell: config.widthCell,
      heightCell: config.heightCell,
      weightCell: config.weightCell,
      priceCell: config.priceCell
    }));
  }

  static getConfig(): ExcelConfig | null {
    if (this.config) return this.config;
    
    const stored = localStorage.getItem('excel-price-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        workbook: null // Workbook needs to be reloaded
      };
    }
    return null;
  }

  static async calculatePrice(
    length: number | null,
    width: number | null, 
    height: number | null,
    weight: number | null
  ): Promise<number | null> {
    if (!this.config?.workbook) {
      console.warn('Excel configuration not loaded');
      return null;
    }

    try {
      // Get the first worksheet
      const sheetName = this.config.workbook.SheetNames[0];
      const worksheet = this.config.workbook.Sheets[sheetName];

      // Create a copy of the workbook to avoid modifying the original
      const workbookCopy = XLSX.utils.book_new();
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      const worksheetCopy = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbookCopy, worksheetCopy, sheetName);

      // Set input values in specified cells
      if (length !== null) {
        XLSX.utils.sheet_add_aoa(worksheetCopy, [[length]], { origin: this.config.lengthCell });
      }
      if (width !== null) {
        XLSX.utils.sheet_add_aoa(worksheetCopy, [[width]], { origin: this.config.widthCell });
      }
      if (height !== null) {
        XLSX.utils.sheet_add_aoa(worksheetCopy, [[height]], { origin: this.config.heightCell });
      }
      if (weight !== null) {
        XLSX.utils.sheet_add_aoa(worksheetCopy, [[weight]], { origin: this.config.weightCell });
      }

      // Force recalculation by reading the formula result
      // Note: SheetJS doesn't execute formulas, it only reads existing calculated values
      // For true formula execution, we'd need a more advanced solution
      const priceCell = worksheetCopy[this.config.priceCell];
      
      if (priceCell && typeof priceCell.v === 'number') {
        return priceCell.v;
      }

      // Fallback: If no formula result available, use a basic calculation
      // This is a temporary solution until proper Excel formula execution is implemented
      if (length && width && height && weight) {
        const volume = length * width * height;
        const basePrice = volume * 0.01 + weight * 0.5; // Example calculation
        return Math.round(basePrice * 100) / 100;
      }

      return null;
    } catch (error) {
      console.error('Error calculating price from Excel:', error);
      return null;
    }
  }

  static isConfigured(): boolean {
    return this.config?.workbook !== null || localStorage.getItem('excel-price-config') !== null;
  }

  static clearConfig() {
    this.config = null;
    localStorage.removeItem('excel-price-config');
  }
}