import React, { useCallback, useState } from 'react';
import { AlertCircle, Upload, Settings, Download } from 'lucide-react';
import { parseCSVFiles } from '../utils/genericCsvParser';
import { exportCategoryMapping } from '../utils/categoryMappingGenerator';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, error }) => {
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFiles = files.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      onFileSelect(csvFiles);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const csvFiles = files.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      onFileSelect(csvFiles);
    }
  }, [onFileSelect]);

  const handleGenerateCategoryMapping = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const csvFiles = files.filter(file => file.name.endsWith('.csv'));

      if (csvFiles.length === 0) {
        setMappingStatus('No CSV files selected');
        return;
      }

      setIsGenerating(true);
      setMappingStatus('Analyzing transactions...');

      try {
        // Parse all CSV files to get transactions
        const transactions = await parseCSVFiles(csvFiles);

        if (transactions.length === 0) {
          setMappingStatus('No transactions found in files');
          return;
        }

        // Generate category mapping
        const mappingJson = exportCategoryMapping(transactions);

        // Create and download the file
        const blob = new Blob([mappingJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'categoryMapping.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setMappingStatus(`✅ Generated mapping from ${transactions.length} transactions with ${Object.keys(mappingJson ? JSON.parse(mappingJson).mappings : {}).length} unique descriptions. File downloaded as categoryMapping.json`);
      } catch (err) {
        console.error('Error generating category mapping:', err);
        setMappingStatus('❌ Error generating category mapping');
      } finally {
        setIsGenerating(false);
      }
    };

    input.click();
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-black rounded-lg p-8"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <label
              htmlFor="file-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: '#fef08a',
                color: '#000000',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fde047';
                e.currentTarget.style.boxShadow = '1px 1px 0px 0px rgba(0,0,0,1)';
                e.currentTarget.style.transform = 'translate(2px, 2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef08a';
                e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV Files
            </label>
          </div>
          <p className="text-black text-sm">
            Select or drag CSV files to upload
          </p>
          <p className="text-black text-xs">
            Drag and drop CSV files here or click the upload button above
          </p>
          <input
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="file-upload"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Category Mapping Generation Section */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Category Mapping Configuration
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Generate a category mapping file from your transaction data. This will analyze ALL unique descriptions
              and map them to categories. Income: salary, company refund, country refund, withdraw, other income.
              Expenses: invest, education, grocery, wear, housing, utility, medical, leisure, gift, other expense.
            </p>
            <button
              onClick={handleGenerateCategoryMapping}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Category Mapping'}
            </button>
          </div>
        </div>

        {mappingStatus && (
          <div className="mt-3 p-2 bg-white border border-gray-200 rounded text-sm">
            {mappingStatus}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-600">
          <p><strong>How it works:</strong></p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Select your CSV files when prompted</li>
            <li>System extracts ALL unique descriptions from transactions</li>
            <li>Each description is mapped alphabetically (e.g., アトレオオイマチ → grocery)</li>
            <li>Downloads categoryMapping.json with all mappings</li>
            <li>Edit the file manually to fix any incorrect mappings</li>
            <li>Save it as data/categoryMapping.json for future use</li>
          </ol>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Error processing files</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Multiple File Upload Features:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Select multiple CSV files at once</li>
          <li>Drag and drop multiple files simultaneously</li>
          <li>Automatic duplicate detection across all files</li>
          <li>Support for bank statements, credit cards, and previous exports</li>
        </ul>
      </div>
    </div>
  );
};