import React, { useCallback } from 'react';
import { FileText, AlertCircle, X, Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, error }) => {

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