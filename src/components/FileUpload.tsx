import React, { useCallback, useState } from 'react';
import { AlertCircle, Upload, Settings } from 'lucide-react';
import { parseCSVFiles } from '../utils/simpleParser';
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
        console.log(`Processing ${csvFiles.length} CSV files...`);
        console.log(`File names:`, csvFiles.map(f => f.name));

        const transactions = await parseCSVFiles(csvFiles);
        console.log(`Parsed ${transactions.length} transactions`);

        if (transactions.length === 0) {
          setMappingStatus('❌ No transactions found in files.\n\n⚠️ Common issues:\n• You uploaded a transaction export file from this app (wrong!)\n• You need to upload ORIGINAL CSV files from your bank/credit card\n• Supported: Orico, PayPay, UFJ, JRE, SMBC, KAL files\n\nIf you uploaded the correct files, check the browser console (F12) for detailed error messages.');
          return;
        }

        // Check if these look like transaction export files (has Type, Category, Shop Name columns)
        const firstTx = transactions[0];
        if (firstTx && firstTx.category && firstTx.category !== 'other_expense' && firstTx.category !== 'other_income') {
          console.warn('[Category Mapping] Warning: Transactions already have categories assigned. These might be export files rather than original bank CSVs.');
        }

        // Log transaction descriptions for debugging
        const uniqueDescriptions = new Set(transactions.map(t => t.description).filter(d => d && d.trim() !== ''));
        console.log(`Found ${uniqueDescriptions.size} unique transaction descriptions`);
        console.log(`Sample descriptions:`, Array.from(uniqueDescriptions).slice(0, 10));

        // Generate category mapping
        const mappingJson = exportCategoryMapping(transactions);
        const mappingData = JSON.parse(mappingJson);
        const mappingCount = Object.keys(mappingData.mappings || {}).length;

        console.log(`Generated ${mappingCount} category mappings`);

        if (mappingCount === 0) {
          setMappingStatus('⚠️ No mappings generated!\n\nPossible causes:\n• Empty or missing description fields in CSV\n• You uploaded transaction export files (must use original bank CSVs!)\n• CSV format not recognized\n\n🔍 Check browser console (F12) for detailed diagnostic information.');
          return;
        }

        if (mappingCount < 10) {
          console.warn(`[Category Mapping] Warning: Only ${mappingCount} mappings generated. This seems unusually low. Expected dozens or hundreds of mappings from real bank CSV files.`);
        }

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

        setMappingStatus(`✅ Success! Generated mapping from ${transactions.length} transactions with ${mappingCount} unique merchant/description mappings.\n\n📥 File downloaded as categoryMapping.json\n\n📝 Next steps:\n1. Open the downloaded file\n2. Review and edit the category assignments\n3. Save it as data/categoryMapping.json in this project`);
      } catch (err) {
        console.error('Error generating category mapping:', err);
        setMappingStatus(`❌ Error generating category mapping: ${err instanceof Error ? err.message : 'Unknown error'}. Check the browser console for details.`);
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
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-bold text-purple-900 mb-2 flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2" />
              Generate Category Mapping (Advanced)
            </h4>
            <div className="bg-white border border-purple-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-800 font-medium mb-2">
                📋 <strong>What this does:</strong> Upload your bank/credit card CSV files to automatically generate a category mapping file.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                💡 <strong>Important:</strong> Upload your <span className="font-bold text-purple-700">original CSV files from your bank/credit card</span> (e.g., Orico, PayPay, UFJ, etc.), NOT transaction files you already exported from this app!
              </p>
              <p className="text-sm text-gray-600">
                The system will read all transaction descriptions from your CSV files and create mappings to categories.
              </p>
            </div>
            <button
              onClick={handleGenerateCategoryMapping}
              disabled={isGenerating}
              className="inline-flex items-center px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isGenerating ? 'Analyzing Transactions...' : 'Upload CSV Files to Generate Mapping'}
            </button>
          </div>
        </div>

        {mappingStatus && (
          <div className="mt-4 p-3 bg-white border-2 border-purple-300 rounded-lg text-sm shadow-sm whitespace-pre-line">
            {mappingStatus}
          </div>
        )}

        <div className="mt-4 bg-white border border-purple-200 rounded-lg p-3">
          <p className="text-xs font-bold text-purple-900 mb-2">📖 How it works:</p>
          <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1.5 ml-2">
            <li><strong>Click the button above</strong> → Select your original bank/credit card CSV files (Orico, PayPay, UFJ, etc.)</li>
            <li><strong>System analyzes</strong> → Extracts ALL unique merchant/transaction descriptions from your CSV files</li>
            <li><strong>Auto-categorizes</strong> → Each description is automatically mapped to a category (e.g., "セブンイレブン" → grocery, "スターバックス" → leisure)</li>
            <li><strong>Downloads file</strong> → categoryMapping.json is downloaded to your computer with all mappings</li>
            <li><strong>Review & edit</strong> → Open the file and manually fix any incorrect category assignments</li>
            <li><strong>Save to project</strong> → Save the edited file as <code className="bg-gray-100 px-1 py-0.5 rounded">data/categoryMapping.json</code> in this project for permanent use</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-gray-600 italic">
              💡 <strong>Tip:</strong> You can also export processed transactions from the "Transactions" tab to review what's already loaded in the app.
            </p>
          </div>
        </div>

        <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <p className="text-xs font-bold text-yellow-900 mb-1">⚠️ Common Mistake:</p>
          <p className="text-xs text-yellow-800">
            Don't upload a transaction file you exported from this app! Upload the <strong>original CSV files from your bank or credit card company</strong>. The transaction export is for backing up your processed data, not for generating mappings.
          </p>
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