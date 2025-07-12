import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

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
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-primary-50 p-4 rounded-full">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Upload Bank Statements
            </p>
            <p className="text-gray-600 mb-4">
              Drag and drop multiple CSV files here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-5 h-5 mr-2" />
              Choose Files
            </label>
          </div>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Upload All Files'}
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select multiple CSV files at once</li>
          <li>• Drag and drop multiple files simultaneously</li>
          <li>• Automatic duplicate detection across all files</li>
          <li>• Support for bank statements, credit cards, and previous exports</li>
          <li>• <strong>Enhanced support for Orico KAL_...csv files</strong></li>
        </ul>
      </div>
    </div>
  );
};