import React, { useState } from 'react';
import { Transaction, User } from '../types/Transaction';
import { FileUpload } from './FileUpload';
import { TransactionTable } from './TransactionTable';
import { StatusView } from './StatusView';
import { parseCSVFile } from '../utils/csvParser';
import { detectAndMergeDuplicates } from '../utils/duplicateDetector';
import { exportTransactionsToCSV } from '../utils/csvExporter';
import { sortTransactionsByDateTime } from '../utils/transactionUtils';
import { LogOut, Upload, Download, BarChart3, FileText } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewMode = 'main' | 'upload' | 'status';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('upload'); // Start with upload, switch to main after data loaded

  const handleFileSelect = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const allParsedTransactions: Transaction[] = [];
      
      // Process each file sequentially
      for (const file of files) {
        try {
          const parsedTransactions = await parseCSVFile(file);
          allParsedTransactions.push(...parsedTransactions);
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue processing other files even if one fails
        }
      }

      if (allParsedTransactions.length === 0) {
        throw new Error('No valid transactions found in the uploaded files');
      }

      // Merge with existing transactions and detect duplicates
      const uniqueTransactions = detectAndMergeDuplicates([...transactions, ...allParsedTransactions]);
      setTransactions(uniqueTransactions);
      setCurrentView('main'); // Always show transaction details after upload
      
      // Show success message
      const processedCount = allParsedTransactions.length;
      const finalCount = uniqueTransactions.length - transactions.length;
      if (processedCount !== finalCount) {
        alert(`Processed ${processedCount} transactions from ${files.length} files. ${processedCount - finalCount} duplicates were merged.`);
      } else {
        alert(`Successfully imported ${finalCount} new transactions from ${files.length} files.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    // Sort transactions by date and time (newest first) for export
    const sortedTransactions = sortTransactionsByDateTime(transactions);
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    exportTransactionsToCSV(sortedTransactions, filename);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Transaction Files</h2>
              <p className="text-gray-600">
                Import multiple bank statements, credit card reports at once.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} error={error} />
          </div>
        );
      case 'status':
        return <StatusView transactions={transactions} />;
      case 'main':
      default:
        return <TransactionTable transactions={transactions} onExport={handleExport} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Account Book</h1>
              <span className="text-sm text-gray-500">Welcome, {user.username}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentView('upload')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </button>
              
              {transactions.length > 0 && (
                <button
                  onClick={() => setCurrentView('main')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'main' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Transactions
                </button>
              )}
              
              {transactions.length > 0 && (
                <button
                  onClick={() => setCurrentView('status')}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'status' 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Stats
                </button>
              )}
              
              <button
                onClick={onLogout}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};