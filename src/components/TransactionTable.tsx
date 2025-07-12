import React from 'react';
import { Transaction } from '../types/Transaction';
import { Download, TrendingUp, TrendingDown, Calendar, MapPin, Tag, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  onExport: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onExport }) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-700 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-secondary-900">¥{totalIncome.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-secondary-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">¥{totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className={`${netAmount >= 0 ? 'bg-secondary-50 border-secondary-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${netAmount >= 0 ? 'text-secondary-700' : 'text-red-700'} text-sm font-medium`}>Net Amount</p>
              <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-secondary-900' : 'text-red-900'}`}>
                ¥{Math.abs(netAmount).toLocaleString()}
              </p>
            </div>
            {netAmount >= 0 ? (
              <TrendingUp className="w-8 h-8 text-secondary-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Transactions ({transactions.length})
        </h2>
        <button
          onClick={onExport}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop/Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">{transaction.time}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{transaction.shopName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      transaction.type === 'income' 
                        ? 'bg-secondary-100 text-secondary-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-600">Upload a CSV file to get started with your transaction history.</p>
        </div>
      )}
    </div>
  );
};