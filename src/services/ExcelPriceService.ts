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
    if (this.config && this.config.workbook) return this.config;
    
    const stored = localStorage.getItem('excel-price-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Return config without workbook - workbook needs to be loaded separately
      return {
        ...parsed,
        workbook: this.config?.workbook || null
      };
    }
    return null;
  }

  static loadWorkbookFromFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (this.config) {
            this.config.workbook = workbook;
          } else {
            // If no config exists, create a basic one
            this.config = {
              fileName: file.name,
              lengthCell: 'A1',
              widthCell: 'A2', 
              heightCell: 'A3',
              weightCell: 'A4',
              priceCell: 'A5',
              workbook: workbook
            };
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
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

    // Return null if any required inputs are null/empty
    if (length === null || width === null || height === null || weight === null) {
      return null;
    }

    try {
      // Get the first worksheet
      const sheetName = this.config.workbook.SheetNames[0];
      const worksheet = this.config.workbook.Sheets[sheetName];

      // Create a deep copy of the worksheet for fresh calculation
      const worksheetCopy = {};
      
      // Copy all cells with their properties
      Object.keys(worksheet).forEach(cellRef => {
        if (cellRef.match(/^[A-Z]+[0-9]+$/) || cellRef.startsWith('!')) {
          worksheetCopy[cellRef] = JSON.parse(JSON.stringify(worksheet[cellRef]));
        }
      });

      // Set the input values in the specified cells
      worksheetCopy[this.config.lengthCell] = { t: 'n', v: length, w: length.toString() };
      worksheetCopy[this.config.widthCell] = { t: 'n', v: width, w: width.toString() };
      worksheetCopy[this.config.heightCell] = { t: 'n', v: height, w: height.toString() };
      worksheetCopy[this.config.weightCell] = { t: 'n', v: weight, w: weight.toString() };

      console.log('Excel calculation inputs:', {
        length: `${this.config.lengthCell}: ${length}`,
        width: `${this.config.widthCell}: ${width}`,
        height: `${this.config.heightCell}: ${height}`,
        weight: `${this.config.weightCell}: ${weight}`
      });

      // Check for formula in the price cell (original sheet)
      const originalPriceCell = worksheet[this.config.priceCell];
      if (originalPriceCell?.f) {
        console.log('Found formula in price cell:', originalPriceCell.f);
        const calculatedPrice = this.evaluateFormula(originalPriceCell.f, worksheetCopy);
        if (calculatedPrice !== null) {
          console.log('Formula calculation result:', calculatedPrice);
          return Math.round(calculatedPrice * 100) / 100;
        }
      }

      // If no formula found, check if there's a static value
      const staticPrice = worksheetCopy[this.config.priceCell]?.v;
      if (typeof staticPrice === 'number' && staticPrice > 0) {
        console.log('Using static price from Excel:', staticPrice);
        return Math.round(staticPrice * 100) / 100;
      }

      // Fallback: return null instead of calculated fallback to indicate missing formula
      console.warn('No Excel formula found in price cell - template may need formulas');
      return null;

    } catch (error) {
      console.error('Error calculating price from Excel:', error);
      return null;
    }
  }

  private static evaluateFormula(formula: string, worksheet: any): number | null {
    try {
      // Remove the = sign if present
      let cleanFormula = formula.startsWith('=') ? formula.slice(1) : formula;
      console.log('Evaluating formula:', cleanFormula);
      
      // Replace cell references with their values (supports A1, AB12, etc.)
      cleanFormula = cleanFormula.replace(/([A-Z]+)([0-9]+)/gi, (match, col, row) => {
        const cellRef = col.toUpperCase() + row;
        const cell = worksheet[cellRef];
        const value = cell?.v !== undefined ? cell.v : 0;
        console.log(`Replacing ${cellRef} with ${value}`);
        return `(${value})`;
      });

      console.log('Formula after cell replacement:', cleanFormula);

      // Handle Excel functions
      cleanFormula = cleanFormula.replace(/SUM\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => {
          const num = parseFloat(v.replace(/[()]/g, '').trim());
          return isNaN(num) ? 0 : num;
        });
        const result = values.reduce((sum: number, val: number) => sum + val, 0);
        return `(${result})`;
      });

      cleanFormula = cleanFormula.replace(/MAX\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => {
          const num = parseFloat(v.replace(/[()]/g, '').trim());
          return isNaN(num) ? 0 : num;
        });
        const result = Math.max(...values);
        return `(${result})`;
      });

      cleanFormula = cleanFormula.replace(/MIN\((.*?)\)/gi, (match, args) => {
        const values = args.split(',').map((v: string) => {
          const num = parseFloat(v.replace(/[()]/g, '').trim());
          return isNaN(num) ? 0 : num;
        });
        const result = Math.min(...values);
        return `(${result})`;
      });

      cleanFormula = cleanFormula.replace(/ABS\((.*?)\)/gi, (match, args) => {
        const value = parseFloat(args.replace(/[()]/g, '').trim());
        const result = Math.abs(isNaN(value) ? 0 : value);
        return `(${result})`;
      });

      cleanFormula = cleanFormula.replace(/ROUND\((.*?),\s*(\d+)\)/gi, (match, value, decimals) => {
        const num = parseFloat(value.replace(/[()]/g, '').trim());
        const dec = parseInt(decimals);
        const result = Math.round((isNaN(num) ? 0 : num) * Math.pow(10, dec)) / Math.pow(10, dec);
        return `(${result})`;
      });

      console.log('Formula after function replacement:', cleanFormula);

      // Clean up the formula for safe evaluation
      cleanFormula = cleanFormula.replace(/\s+/g, ' ').trim();
      
      // Validate that the formula only contains safe characters
      if (!/^[0-9\+\-\*\/\.\(\)\s]+$/.test(cleanFormula)) {
        console.warn('Formula contains unsafe characters, skipping evaluation');
        return null;
      }

      // Evaluate basic mathematical expressions
      const result = Function('"use strict"; return (' + cleanFormula + ')')();
      
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error evaluating formula:', error);
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