import * as XLSX from 'xlsx';
// @ts-ignore - xlsx-calc has no types
import calculate from 'xlsx-calc';

// Template URL constant
const TEMPLATE_URL = 'https://isonacokyyhnwpmwbpqp.supabase.co/storage/v1/object/public/files/Prijsstelling%20per%20sheet%202.0.xlsx';

// Valid sheet types
export type SheetType = 'Verzinken' | 'Dompelbeitsen' | 'Sublimotion';

// Cache for the workbook
let cachedWorkbook: XLSX.WorkBook | null = null;

/**
 * Download and cache the Excel template
 */
async function downloadTemplate(): Promise<XLSX.WorkBook> {
  if (cachedWorkbook) {
    return cachedWorkbook;
  }

  try {
    const response = await fetch(TEMPLATE_URL);
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    cachedWorkbook = workbook;
    return workbook;
  } catch (error) {
    console.error('Error downloading Excel template:', error);
    throw new Error('Kan Excel template niet downloaden');
  }
}

/**
 * Set a numeric value in a specific cell
 */
function setNum(worksheet: XLSX.WorkSheet, address: string, value: number): void {
  if (!worksheet[address]) {
    worksheet[address] = { t: 'n', v: value };
  } else {
    worksheet[address].v = value;
    worksheet[address].t = 'n';
  }
}

/**
 * Get a value from a specific cell
 */
function getVal(worksheet: XLSX.WorkSheet, address: string): number | null {
  const cell = worksheet[address];
  if (!cell || cell.v === undefined || cell.v === null) {
    return null;
  }
  
  const value = typeof cell.v === 'number' ? cell.v : parseFloat(cell.v);
  return isNaN(value) ? null : value;
}

/**
 * Convert comma decimal to dot decimal (Dutch to English format)
 */
function normalizeNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  return parseFloat(value.toString().replace(',', '.'));
}

/**
 * Validate input values
 */
function validateInputs(length: number, width: number, height: number, weight: number): void {
  const values = [length, width, height, weight];
  const names = ['Lengte', 'Breedte', 'Hoogte', 'Gewicht'];
  
  values.forEach((value, index) => {
    if (isNaN(value) || value <= 0) {
      throw new Error(`${names[index]} moet een geldig positief getal zijn`);
    }
  });
}

/**
 * Main calculation function
 */
export async function calcL17({
  sheet,
  length,
  width,
  height,
  weight
}: {
  sheet: SheetType;
  length: number | string;
  width: number | string;
  height: number | string;
  weight: number | string;
}): Promise<number | null> {
  try {
    // Normalize inputs
    const normalizedLength = normalizeNumber(length);
    const normalizedWidth = normalizeNumber(width);
    const normalizedHeight = normalizeNumber(height);
    const normalizedWeight = normalizeNumber(weight);

    // Validate inputs
    validateInputs(normalizedLength, normalizedWidth, normalizedHeight, normalizedWeight);

    // Download template
    const workbook = await downloadTemplate();

    // Check if sheet exists
    if (!workbook.Sheets[sheet]) {
      throw new Error(`Werkblad "${sheet}" niet gevonden in template`);
    }

    // Create a copy of the worksheet for calculation
    const worksheet = { ...workbook.Sheets[sheet] };

    // Set input values in the specified cells
    setNum(worksheet, 'D67', normalizedLength);
    setNum(worksheet, 'D68', normalizedWidth);
    setNum(worksheet, 'D69', normalizedHeight);
    setNum(worksheet, 'D74', normalizedWeight);

    // Create a temporary workbook for calculation
    const tempWorkbook = {
      ...workbook,
      Sheets: {
        ...workbook.Sheets,
        [sheet]: worksheet
      }
    };

    // Recalculate formulas
    calculate(tempWorkbook);

    // Get the result from L17
    const result = getVal(tempWorkbook.Sheets[sheet], 'L17');

    console.log(`Excel calculation result for ${sheet}:`, {
      inputs: { length: normalizedLength, width: normalizedWidth, height: normalizedHeight, weight: normalizedWeight },
      result
    });

    return result;

  } catch (error) {
    console.error('Error in calcL17:', error);
    throw error;
  }
}

/**
 * Clear the cached workbook (useful for testing or memory cleanup)
 */
export function clearCache(): void {
  cachedWorkbook = null;
}

/**
 * Test function with provided values
 */
export async function testCalculation(): Promise<void> {
  try {
    const result = await calcL17({
      sheet: 'Sublimotion',
      length: 2000,
      width: 500,
      height: 500,
      weight: 700
    });
    
    console.log('Test calculation result:', result);
    
    if (result !== null) {
      console.log(`✅ Test successful: L17 = ${result}`);
    } else {
      console.log('⚠️ Test returned null - check Excel formulas');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}