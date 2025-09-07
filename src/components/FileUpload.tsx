import React, { useCallback } from 'react';
import { FileText, AlertCircle, X, Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, error }) => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFiles = files.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      setSelectedFiles(csvFiles);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const csvFiles = files.filter(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      setSelectedFiles(csvFiles);
    }
  }, []);

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(files => files.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            {selectedFiles.length === 0 ? 'No files selected' : `${selectedFiles.length} file(s) ready to upload`}
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

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-black p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-black">Selected Files ({selectedFiles.length})</h4>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-yellow-200 hover:bg-yellow-300 text-black font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Upload All Files'}
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-black" />
                  <div>
                    <p className="text-sm font-medium text-black truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-black">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-black hover:text-red-600 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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