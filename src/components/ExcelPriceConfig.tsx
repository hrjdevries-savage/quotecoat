import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Save, TestTube, Trash2, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { ExcelPriceService, ExcelConfig } from '@/services/ExcelPriceService';
import { toast } from 'sonner';

export const ExcelPriceConfig = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [config, setConfig] = useState<ExcelConfig>({
    fileName: '',
    selectedSheet: '',
    lengthCell: 'A1',
    widthCell: 'A2',
    heightCell: 'A3',
    weightCell: 'A4',
    priceCell: 'A5',
    workbook: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testInputs, setTestInputs] = useState({ length: 100, width: 200, height: 50, weight: 10 });
  const [testResult, setTestResult] = useState<number | null>(null);

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const existingConfig = await ExcelPriceService.loadConfig();
      if (existingConfig) {
        setConfig(existingConfig);
        setAvailableSheets(ExcelPriceService.getAvailableSheets());
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Error loading existing config:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { workbook, sheets } = await ExcelPriceService.loadWorkbookFromFile(file);
      
      setUploadedFile(file);
      setAvailableSheets(sheets);
      setConfig(prev => ({
        ...prev,
        fileName: file.name,
        workbook,
        selectedSheet: sheets[0] || '' // Auto-select first sheet
      }));
      
      toast.success(`Excel file uploaded successfully. Found ${sheets.length} sheet(s).`);
    } catch (error) {
      setError('Failed to read Excel file. Please ensure it\'s a valid Excel document.');
      console.error('Excel upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateConfig = (): boolean => {
    if (!config.selectedSheet) {
      setError('Please select a worksheet');
      return false;
    }
    
    if (!config.lengthCell || !config.widthCell || !config.heightCell || !config.weightCell || !config.priceCell) {
      setError('Please fill in all cell references');
      return false;
    }

    const cellPattern = /^[A-Z]+[0-9]+$/i;
    const cells = [config.lengthCell, config.widthCell, config.heightCell, config.weightCell, config.priceCell];
    
    for (const cell of cells) {
      if (!cellPattern.test(cell)) {
        setError(`Invalid cell reference: ${cell}. Use format like A1, B2, etc.`);
        return false;
      }
    }

    return true;
  };

  const handleSaveConfig = async () => {
    if (!validateConfig()) return;

    setIsLoading(true);
    setError('');

    try {
      await ExcelPriceService.saveConfig(config, uploadedFile || undefined);
      setIsConfigured(true);
      toast.success('Excel configuration saved successfully!');
    } catch (error) {
      setError('Failed to save configuration. Please try again.');
      console.error('Save config error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCalculation = async () => {
    if (!validateConfig()) return;

    setIsLoading(true);
    try {
      const { price, debugInfo } = await ExcelPriceService.calculatePrice(
        testInputs.length,
        testInputs.width,
        testInputs.height,
        testInputs.weight
      );
      
      setTestResult(price);
      
      if (debugInfo.errors.length > 0) {
        setError(`Test calculation issues: ${debugInfo.errors.join(', ')}`);
      } else {
        setError('');
        toast.success('Test calculation completed successfully!');
      }
    } catch (error) {
      setError('Test calculation failed');
      console.error('Test calculation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConfiguration = async () => {
    try {
      await ExcelPriceService.clearConfig();
      setConfig({
        fileName: '',
        selectedSheet: '',
        lengthCell: 'A1',
        widthCell: 'A2',
        heightCell: 'A3',
        weightCell: 'A4',
        priceCell: 'A5',
        workbook: null
      });
      setUploadedFile(null);
      setAvailableSheets([]);
      setIsConfigured(false);
      setTestResult(null);
      setError('');
      toast.success('Configuration cleared successfully');
    } catch (error) {
      setError('Failed to clear configuration');
      console.error('Clear config error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <Badge variant={isConfigured ? "default" : "destructive"} className="flex items-center gap-2">
          {isConfigured ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {isConfigured ? 'Configuration Active' : 'Not Configured'}
        </Badge>
        {isConfigured && (
          <Button variant="outline" size="sm" onClick={clearConfiguration}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Config
          </Button>
        )}
      </div>

      {/* Current Configuration */}
      {isConfigured && (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            Active template: <strong>{config.fileName}</strong> | 
            Sheet: <strong>{config.selectedSheet}</strong> | 
            Cells: L={config.lengthCell}, W={config.widthCell}, H={config.heightCell}, Kg={config.weightCell} → Price={config.priceCell}
          </AlertDescription>
        </Alert>
      )}

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Excel Template Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-file">Upload Excel File (.xlsx/.xls)</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </div>

          {uploadedFile && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Uploaded: <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)} KB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sheet Selection */}
      {availableSheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Worksheet Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="sheet-select">Select Worksheet</Label>
              <Select
                value={config.selectedSheet}
                onValueChange={(value) => setConfig(prev => ({ ...prev, selectedSheet: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a worksheet" />
                </SelectTrigger>
                <SelectContent>
                  {availableSheets.map((sheet) => (
                    <SelectItem key={sheet} value={sheet}>
                      {sheet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cell Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Cell Mapping Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="length-cell">Length Cell</Label>
              <Input
                id="length-cell"
                value={config.lengthCell}
                onChange={(e) => setConfig(prev => ({ ...prev, lengthCell: e.target.value.toUpperCase() }))}
                placeholder="A1"
              />
            </div>
            <div>
              <Label htmlFor="width-cell">Width Cell</Label>
              <Input
                id="width-cell"
                value={config.widthCell}
                onChange={(e) => setConfig(prev => ({ ...prev, widthCell: e.target.value.toUpperCase() }))}
                placeholder="A2"
              />
            </div>
            <div>
              <Label htmlFor="height-cell">Height Cell</Label>
              <Input
                id="height-cell"
                value={config.heightCell}
                onChange={(e) => setConfig(prev => ({ ...prev, heightCell: e.target.value.toUpperCase() }))}
                placeholder="A3"
              />
            </div>
            <div>
              <Label htmlFor="weight-cell">Weight Cell</Label>
              <Input
                id="weight-cell"
                value={config.weightCell}
                onChange={(e) => setConfig(prev => ({ ...prev, weightCell: e.target.value.toUpperCase() }))}
                placeholder="A4"
              />
            </div>
            <div>
              <Label htmlFor="price-cell">Price Output Cell</Label>
              <Input
                id="price-cell"
                value={config.priceCell}
                onChange={(e) => setConfig(prev => ({ ...prev, priceCell: e.target.value.toUpperCase() }))}
                placeholder="A5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="test-length">Length (mm)</Label>
              <Input
                id="test-length"
                type="number"
                value={testInputs.length}
                onChange={(e) => setTestInputs(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="test-width">Width (mm)</Label>
              <Input
                id="test-width"
                type="number"
                value={testInputs.width}
                onChange={(e) => setTestInputs(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="test-height">Height (mm)</Label>
              <Input
                id="test-height"
                type="number"
                value={testInputs.height}
                onChange={(e) => setTestInputs(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="test-weight">Weight (kg)</Label>
              <Input
                id="test-weight"
                type="number"
                step="0.1"
                value={testInputs.weight}
                onChange={(e) => setTestInputs(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={handleTestCalculation} disabled={isLoading}>
              <TestTube className="h-4 w-4 mr-2" />
              Test Calculate
            </Button>
            {testResult !== null && (
              <Alert className="flex-1">
                <AlertDescription>
                  <strong>Test Result: €{testResult.toFixed(2)}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Configuration */}
      <div className="flex gap-4">
        <Button 
          onClick={handleSaveConfig} 
          disabled={isLoading || !config.workbook}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};