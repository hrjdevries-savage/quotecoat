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

    try {
      // Get the first worksheet
      const sheetName = this.config.workbook.SheetNames[0];
      const worksheet = this.config.workbook.Sheets[sheetName];

      // Create a fresh copy of the worksheet for each calculation
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      const worksheetCopy = XLSX.utils.aoa_to_sheet(sheetData);

      // Set the input values in the specified cells
      if (length !== null && this.config.lengthCell) {
        worksheetCopy[this.config.lengthCell] = { t: 'n', v: length };
      }
      if (width !== null && this.config.widthCell) {
        worksheetCopy[this.config.widthCell] = { t: 'n', v: width };
      }
      if (height !== null && this.config.heightCell) {
        worksheetCopy[this.config.heightCell] = { t: 'n', v: height };
      }
      if (weight !== null && this.config.weightCell) {
        worksheetCopy[this.config.weightCell] = { t: 'n', v: weight };
      }

      console.log('Input values set:', {
        length: `${this.config.lengthCell}: ${length}`,
        width: `${this.config.widthCell}: ${width}`,
        height: `${this.config.heightCell}: ${height}`,
        weight: `${this.config.weightCell}: ${weight}`
      });

      // Try to read the price cell value
      const priceCell = worksheetCopy[this.config.priceCell];
      console.log('Price cell content:', priceCell);
      
      // If the price cell contains a formula, we need to evaluate it manually
      // Since SheetJS can't execute formulas, we'll implement basic formula evaluation
      if (priceCell?.f) {
        console.log('Formula detected in price cell:', priceCell.f);
        const calculatedPrice = this.evaluateBasicFormula(priceCell.f, worksheetCopy);
        if (calculatedPrice !== null) {
          return calculatedPrice;
        }
      }
      
      // If there's a numeric value in the price cell, use it
      if (priceCell && typeof priceCell.v === 'number') {
        console.log('Using existing price value:', priceCell.v);
        return priceCell.v;
      }

      // Fallback: Basic calculation if all dimensions are provided
      if (length && width && height && weight) {
        const volume = (length / 1000) * (width / 1000) * (height / 1000); // Convert mm to m
        const volumePrice = volume * 1000; // €1000 per cubic meter
        const weightPrice = weight * 2; // €2 per kg
        const basePrice = volumePrice + weightPrice + 50; // Base cost €50
        const calculatedPrice = Math.round(basePrice * 100) / 100;
        console.log('Using fallback calculation:', calculatedPrice);
        return calculatedPrice;
      }

      console.warn('Could not calculate price - insufficient data');
      return null;
    } catch (error) {
      console.error('Error calculating price from Excel:', error);
      return null;
    }
  }

  private static evaluateBasicFormula(formula: string, worksheet: any): number | null {
    try {
      // Remove the = sign if present
      let cleanFormula = formula.startsWith('=') ? formula.slice(1) : formula;
      
      // Replace cell references with their values
      cleanFormula = cleanFormula.replace(/[A-Z]+[0-9]+/g, (cellRef) => {
        const cell = worksheet[cellRef];
        return cell?.v?.toString() || '0';
      });

      // Evaluate basic mathematical expressions
      // WARNING: This is a simplified evaluation - only use with trusted formulas
      const result = Function('"use strict"; return (' + cleanFormula + ')')();
      
      if (typeof result === 'number' && !isNaN(result)) {
        console.log('Formula evaluation result:', result);
        return Math.round(result * 100) / 100;
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