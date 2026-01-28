import React, { useCallback, useState } from 'react';
import { Upload, Settings } from 'lucide-react';
import { parseCSVFiles } from '../utils/parsing/csvParser';
import { exportCategoryMapping } from '../utils/category/categoryMappingGenerator';

export const CategoryMappingPanel: React.FC = () => {
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
        const transactions = await parseCSVFiles(csvFiles);

        if (transactions.length === 0) {
          setMappingStatus('❌ No transactions found in files.\n\n⚠️ Common issues:\n• You uploaded a transaction export file from this app (wrong!)\n• You need to upload ORIGINAL CSV files from your bank/credit card\n• Supported: Orico, PayPay, UFJ, JRE, SMBC, KAL files');
          return;
        }

        const mappingJson = exportCategoryMapping(transactions);
        const mappingData = JSON.parse(mappingJson);
        const mappingCount = Object.keys(mappingData.mappings || {}).length;

        if (mappingCount === 0) {
          setMappingStatus('⚠️ No mappings generated!');
          return;
        }

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
        setMappingStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsGenerating(false);
      }
    };

    input.click();
  }, []);

  return (
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
              💡 <strong>Important:</strong> Upload your <span className="font-bold text-purple-700">original CSV files from your bank/credit card</span>, NOT transaction files exported from this app!
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
          <li><strong>Click the button above</strong> → Select your original bank/credit card CSV files</li>
          <li><strong>System analyzes</strong> → Extracts ALL unique merchant/transaction descriptions</li>
          <li><strong>Auto-categorizes</strong> → Each description is mapped to a category</li>
          <li><strong>Downloads file</strong> → categoryMapping.json is downloaded</li>
          <li><strong>Review & edit</strong> → Fix any incorrect category assignments</li>
          <li><strong>Save to project</strong> → Save as <code className="bg-gray-100 px-1 py-0.5 rounded">data/categoryMapping.json</code></li>
        </ol>
      </div>

      <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
        <p className="text-xs font-bold text-yellow-900 mb-1">⚠️ Common Mistake:</p>
        <p className="text-xs text-yellow-800">
          Don't upload a transaction file you exported from this app! Upload the <strong>original CSV files from your bank or credit card company</strong>.
        </p>
      </div>
    </div>
  );
};
