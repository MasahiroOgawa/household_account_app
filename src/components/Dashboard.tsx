import React, { useState } from 'react';
import { Transaction, User } from '../types/Transaction';
import { FileUpload } from './FileUpload';
import { TransactionTable } from './TransactionTable';
import { StatusView } from './StatusView';
import { parseCSVFiles } from '../utils/parsing/csvParser';
import { detectAndMergeDuplicates } from '../utils/duplicateDetector';
import { exportTransactionsByYear, exportTransactionsForTaxReturn } from '../utils/csvExporter';
import { sortTransactionsByDateTime } from '../utils/transactionUtils';
import { CategoryEditor } from './CategoryEditor';
import { BlueReturnView } from './BlueReturnView';
import { normalizeCategory } from '../utils/category/categoryDisplay';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewMode = 'main' | 'upload' | 'status' | 'categories' | 'blue_return';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('upload');

  const handleFileSelect = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const allParsedTransactions = await parseCSVFiles(files);

      if (allParsedTransactions.length === 0) {
        setError('No valid transactions found in the uploaded files.');
        setIsLoading(false);
        return;
      }

      const uniqueTransactions = detectAndMergeDuplicates([...transactions, ...allParsedTransactions]);
      setTransactions(uniqueTransactions);

      setTimeout(() => {
        setCurrentView('status');
      }, 100);

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
    exportTransactionsByYear(sortTransactionsByDateTime(transactions));
  };

  const handleExportTaxReturn = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    exportTransactionsForTaxReturn(sortTransactionsByDateTime(transactions));
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: normalizeCategory(newCategory) } : t));
  };

  const renderContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-2">Upload Transaction Files</h2>
              <p className="text-black">
                Import multiple bank statements, credit card reports at once.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} error={error} />
          </div>
        );
      case 'status':
        return <StatusView transactions={transactions} />;
      case 'categories':
        return <CategoryEditor transactions={transactions} />;
      case 'blue_return':
        return <BlueReturnView transactions={transactions} />;
      case 'main':
      default:
        return <TransactionTable transactions={transactions} onExport={handleExport} onExportTaxReturn={handleExportTaxReturn} onCategoryChange={handleCategoryChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-black">Account Book</h1>
              <span className="text-sm text-black">Welcome, {user.username}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-0">
          <button
            onClick={() => setCurrentView('upload')}
            className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ${
              currentView === 'upload'
                ? 'bg-gray-300 text-black border-2 border-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] -mb-[2px] relative z-10'
                : 'bg-gray-200 text-black border-2 border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px]'
            }`}
          >
            Upload
          </button>

          {transactions.length > 0 && (
            <button
              onClick={() => setCurrentView('main')}
              className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ml-2 ${
                currentView === 'main'
                  ? 'bg-gray-300 text-black border-2 border-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] -mb-[2px] relative z-10'
                  : 'bg-gray-200 text-black border-2 border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px]'
              }`}
            >
              Transactions
            </button>
          )}

          {transactions.length > 0 && (
            <button
              onClick={() => setCurrentView('status')}
              className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ml-2 ${
                currentView === 'status'
                  ? 'bg-gray-300 text-black border-2 border-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] -mb-[2px] relative z-10'
                  : 'bg-gray-200 text-black border-2 border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px]'
              }`}
            >
              View Stats
            </button>
          )}

          <button
            onClick={() => setCurrentView('categories')}
            className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ml-2 ${
              currentView === 'categories'
                ? 'bg-gray-300 text-black border-2 border-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] -mb-[2px] relative z-10'
                : 'bg-gray-200 text-black border-2 border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px]'
            }`}
          >
            Categories
          </button>

          {transactions.length > 0 && (
            <button
              onClick={() => setCurrentView('blue_return')}
              className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-all ml-2 ${
                currentView === 'blue_return'
                  ? 'bg-gray-300 text-black border-2 border-black shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] -mb-[2px] relative z-10'
                  : 'bg-gray-200 text-black border-2 border-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px]'
              }`}
            >
              確定申告
            </button>
          )}

          <button
            onClick={onLogout}
            className="px-6 py-2 text-sm font-medium bg-gray-200 text-red-600 border-2 border-gray-400 rounded-t-lg shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gray-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:translate-y-[1px] transition-all ml-2"
          >
            Logout
          </button>
        </div>

        <div className="bg-white" style={{ border: '2px solid black', padding: '32px', minHeight: '600px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
