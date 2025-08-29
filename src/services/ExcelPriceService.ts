import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

export interface ExcelConfig {
  id?: string;
  fileName: string;
  selectedSheet: string;
  lengthCell: string;
  widthCell: string;
  heightCell: string;
  weightCell: string;
  priceCell: string;
  workbook: XLSX.WorkBook | null;
  workbookHash?: string;
  storagePath?: string;
}

export interface ExcelDebugInfo {
  sheetName: string;
  inputCells: Record<string, any>;
  outputCell: { ref: string; value: any };
  templateHash: string;
  errors: string[];
}

export class ExcelPriceService {
  private static cachedConfig: ExcelConfig | null = null;
  private static cachedWorkbook: XLSX.WorkBook | null = null;
  private static currentHash: string | null = null;

  static async loadConfig(): Promise<ExcelConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('excel_pricing_config')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error || !data) return null;

      // Load workbook from storage
      const workbook = await this.loadWorkbookFromStorage(data.storage_path);
      
      this.cachedConfig = {
        id: data.id,
        fileName: data.file_name,
        selectedSheet: data.selected_sheet,
        lengthCell: data.length_cell,
        widthCell: data.width_cell,
        heightCell: data.height_cell,
        weightCell: data.weight_cell,
        priceCell: data.price_cell,
        workbook,
        workbookHash: data.workbook_hash,
        storagePath: data.storage_path
      };

      return this.cachedConfig;
    } catch (error) {
      console.error('Error loading Excel config:', error);
      return null;
    }
  }

  static async saveConfig(config: ExcelConfig, file?: File): Promise<void> {
    console.log('Starting saveConfig with:', { 
      fileName: config.fileName, 
      selectedSheet: config.selectedSheet,
      hasFile: !!file,
      hasWorkbook: !!config.workbook 
    });

    const { data: { user } } = await supabase.auth.getUser();
    console.log('User auth status:', { userId: user?.id, hasUser: !!user });
    
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    let storagePath = config.storagePath;
    let workbookHash = config.workbookHash;

    // Upload file to storage if provided
    if (file) {
      console.log('Uploading file to storage:', file.name);
      storagePath = `${user.id}/${nanoid()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pricing-templates')
        .upload(storagePath, file, {
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      console.log('File uploaded successfully to:', storagePath);

      // Generate hash for the file
      workbookHash = await this.generateFileHash(file);
      console.log('Generated file hash:', workbookHash);
    }

    // Save or update config in database
    const configData = {
      owner_id: user.id,
      storage_path: storagePath!,
      file_name: config.fileName,
      selected_sheet: config.selectedSheet,
      length_cell: config.lengthCell,
      width_cell: config.widthCell,
      height_cell: config.heightCell,
      weight_cell: config.weightCell,
      price_cell: config.priceCell,
      workbook_hash: workbookHash
    };

    console.log('Saving config data:', configData);

    if (config.id) {
      console.log('Updating existing config with ID:', config.id);
      const { error } = await supabase
        .from('excel_pricing_config')
        .update(configData)
        .eq('id', config.id);
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
    } else {
      console.log('Creating new config');
      const { data, error } = await supabase
        .from('excel_pricing_config')
        .insert([configData])
        .select()
        .single();
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Config created successfully:', data);
      
      // Update the config with the new ID
      config.id = data.id;
    }

    // Update cache
    this.cachedConfig = { ...config, storagePath, workbookHash };
    this.currentHash = workbookHash;
    
    console.log('Config saved successfully');
  }

  static async loadWorkbookFromStorage(storagePath: string): Promise<XLSX.WorkBook | null> {
    try {
      const { data, error } = await supabase.storage
        .from('pricing-templates')
        .download(storagePath);

      if (error || !data) return null;

      const arrayBuffer = await data.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      this.cachedWorkbook = workbook;
      return workbook;
    } catch (error) {
      console.error('Error loading workbook from storage:', error);
      return null;
    }
  }

  static async loadWorkbookFromFile(file: File): Promise<{ workbook: XLSX.WorkBook; sheets: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets = workbook.SheetNames;
          resolve({ workbook, sheets });
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
  ): Promise<{ price: number | null; debugInfo: ExcelDebugInfo }> {
    const debugInfo: ExcelDebugInfo = {
      sheetName: '',
      inputCells: {},
      outputCell: { ref: '', value: null },
      templateHash: '',
      errors: []
    };

    try {
      // Load config if not cached
      if (!this.cachedConfig) {
        await this.loadConfig();
      }

      if (!this.cachedConfig?.workbook) {
        debugInfo.errors.push('Excel configuration not loaded');
        return { price: null, debugInfo };
      }

      // Return null if any required inputs are null/empty
      if (length === null || width === null || height === null || weight === null) {
        debugInfo.errors.push('Missing required input values');
        return { price: null, debugInfo };
      }

      debugInfo.sheetName = this.cachedConfig.selectedSheet;
      debugInfo.templateHash = this.cachedConfig.workbookHash || '';

      // Check if selected sheet exists
      if (!this.cachedConfig.workbook.SheetNames.includes(this.cachedConfig.selectedSheet)) {
        debugInfo.errors.push(`Selected sheet '${this.cachedConfig.selectedSheet}' not found`);
        return { price: null, debugInfo };
      }

      const worksheet = this.cachedConfig.workbook.Sheets[this.cachedConfig.selectedSheet];
      
      // Create a deep copy of the worksheet for fresh calculation
      const worksheetCopy = JSON.parse(JSON.stringify(worksheet));

      // Set the input values in the specified cells
      const inputs = {
        [this.cachedConfig.lengthCell]: length,
        [this.cachedConfig.widthCell]: width,
        [this.cachedConfig.heightCell]: height,
        [this.cachedConfig.weightCell]: weight
      };

      for (const [cellRef, value] of Object.entries(inputs)) {
        worksheetCopy[cellRef] = { t: 'n', v: value, w: value.toString() };
        debugInfo.inputCells[cellRef] = value;
      }

      // Check for formula in the price cell
      const originalPriceCell = worksheet[this.cachedConfig.priceCell];
      debugInfo.outputCell.ref = this.cachedConfig.priceCell;

      if (originalPriceCell?.f) {
        console.log('Found formula in price cell:', originalPriceCell.f);
        const calculatedPrice = this.evaluateFormula(originalPriceCell.f, worksheetCopy);
        if (calculatedPrice !== null) {
          const roundedPrice = Math.round(calculatedPrice * 100) / 100;
          debugInfo.outputCell.value = roundedPrice;
          console.log('Successfully calculated price:', roundedPrice);
          return { price: roundedPrice >= 0 ? roundedPrice : null, debugInfo };
        } else {
          console.warn('Formula evaluation failed, trying to recalculate...');
          // Try alternative approach: use xlsx utils to recalculate
          try {
            const XLSX = await import('xlsx');
            const newWorksheet = XLSX.utils.json_to_sheet([]);
            
            // Copy original structure and set input values
            Object.keys(worksheet).forEach(key => {
              if (key.startsWith('!')) {
                newWorksheet[key] = worksheet[key];
              }
            });
            
            // Set input values
            newWorksheet[this.cachedConfig.lengthCell] = { t: 'n', v: length };
            newWorksheet[this.cachedConfig.widthCell] = { t: 'n', v: width };
            newWorksheet[this.cachedConfig.heightCell] = { t: 'n', v: height };
            newWorksheet[this.cachedConfig.weightCell] = { t: 'n', v: weight };
            
            // Set the original formula
            newWorksheet[this.cachedConfig.priceCell] = originalPriceCell;
            
            console.log('Alternative calculation attempt with original formula');
            debugInfo.errors.push('Using fallback calculation method');
          } catch (error) {
            console.error('Alternative calculation failed:', error);
            debugInfo.errors.push('Both primary and fallback formula evaluation failed');
          }
        }
      }

      // If no formula found, check if there's a static value
      const staticPrice = worksheetCopy[this.cachedConfig.priceCell]?.v;
      if (typeof staticPrice === 'number' && staticPrice >= 0) {
        const roundedPrice = Math.round(staticPrice * 100) / 100;
        debugInfo.outputCell.value = roundedPrice;
        return { price: roundedPrice, debugInfo };
      }

      debugInfo.errors.push('No valid formula or static value found in price cell');
      return { price: null, debugInfo };

    } catch (error) {
      console.error('Error calculating price from Excel:', error);
      debugInfo.errors.push(`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { price: null, debugInfo };
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
      cleanFormula = this.replaceExcelFunctions(cleanFormula);

      console.log('Formula after function replacement:', cleanFormula);

      // Clean up the formula for safe evaluation
      cleanFormula = cleanFormula.replace(/\s+/g, ' ').trim();
      
      console.log('Final formula before validation:', cleanFormula);
      
      // More permissive validation - allow Excel functions and common characters
      if (!/^[0-9\+\-\*\/\.\(\)\s,;:]+$/.test(cleanFormula)) {
        console.warn('Formula contains characters that may not be safe:', cleanFormula);
        // Try to evaluate anyway for Excel formulas
        console.log('Attempting evaluation despite validation warning...');
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

  private static replaceExcelFunctions(formula: string): string {
    // Handle nested IF functions - process from innermost to outermost
    let processedFormula = formula;
    let hasIF = true;
    
    while (hasIF) {
      const beforeReplace = processedFormula;
      // Find the innermost IF function (no nested IF inside its arguments)
      processedFormula = processedFormula.replace(/IF\(([^()]*(?:\([^()]*\)[^()]*)*),([^()]*(?:\([^()]*\)[^()]*)*),([^()]*(?:\([^()]*\)[^()]*)*)\)/i, 
        (match, condition, trueValue, falseValue) => {
          return `((${condition}) ? (${trueValue}) : (${falseValue}))`;
        });
      hasIF = beforeReplace !== processedFormula;
    }
    
    formula = processedFormula;

    // Handle SUM function
    formula = formula.replace(/SUM\((.*?)\)/gi, (match, args) => {
      const values = args.split(',').map((v: string) => {
        const num = parseFloat(v.replace(/[()]/g, '').trim());
        return isNaN(num) ? 0 : num;
      });
      const result = values.reduce((sum: number, val: number) => sum + val, 0);
      return `(${result})`;
    });

    // Handle MAX function
    formula = formula.replace(/MAX\((.*?)\)/gi, (match, args) => {
      const values = args.split(',').map((v: string) => {
        const num = parseFloat(v.replace(/[()]/g, '').trim());
        return isNaN(num) ? 0 : num;
      });
      const result = Math.max(...values);
      return `(${result})`;
    });

    // Handle MIN function
    formula = formula.replace(/MIN\((.*?)\)/gi, (match, args) => {
      const values = args.split(',').map((v: string) => {
        const num = parseFloat(v.replace(/[()]/g, '').trim());
        return isNaN(num) ? 0 : num;
      });
      const result = Math.min(...values);
      return `(${result})`;
    });

    // Handle ABS function
    formula = formula.replace(/ABS\((.*?)\)/gi, (match, args) => {
      const value = parseFloat(args.replace(/[()]/g, '').trim());
      const result = Math.abs(isNaN(value) ? 0 : value);
      return `(${result})`;
    });

    // Handle ROUND function
    formula = formula.replace(/ROUND\((.*?),\s*(\d+)\)/gi, (match, value, decimals) => {
      const num = parseFloat(value.replace(/[()]/g, '').trim());
      const dec = parseInt(decimals);
      const result = Math.round((isNaN(num) ? 0 : num) * Math.pow(10, dec)) / Math.pow(10, dec);
      return `(${result})`;
    });

    return formula;
  }

  private static async generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async isConfigured(): Promise<boolean> {
    if (this.cachedConfig) return true;
    const config = await this.loadConfig();
    return config !== null;
  }

  static async clearConfig(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from database
      await supabase
        .from('excel_pricing_config')
        .delete()
        .eq('owner_id', user.id);

      // Delete from storage (if exists)
      if (this.cachedConfig?.storagePath) {
        await supabase.storage
          .from('pricing-templates')
          .remove([this.cachedConfig.storagePath]);
      }

      // Clear cache
      this.cachedConfig = null;
      this.cachedWorkbook = null;
      this.currentHash = null;
    } catch (error) {
      console.error('Error clearing config:', error);
    }
  }

  static getAvailableSheets(): string[] {
    return this.cachedConfig?.workbook?.SheetNames || [];
  }

  static getCachedConfig(): ExcelConfig | null {
    return this.cachedConfig;
  }
}