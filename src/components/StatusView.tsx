import React from 'react';
import { Transaction } from '../types/Transaction';
import { BarChart3, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { calculateMonthlyTotals } from '../utils/monthlyCalculations';
import { getCategoryColor, getIncomeCategoryColor } from '../utils/category/categoryColors';
import { getCategoryDisplayName, normalizeCategory } from '../utils/category/categoryDisplay';
import { resolveToEnglishCategory } from '../utils/category/subcategoryUtils';
import { PieChartSVG } from './charts/PieChart';
import { PieChartLegend } from './charts/PieChartLegend';
import { MonthlyBarChart, MonthlyBarData } from './charts/BarChart';

interface StatusViewProps {
  transactions: Transaction[];
}

const aggregateByCategory = (transactions: Transaction[], type: 'income' | 'expense'): [string, number][] => {
  const categories = transactions
    .filter(t => t.type === type)
    .reduce((acc, t) => {
      const defaultCategory = type === 'income' ? 'other_income' : 'other_expense';
      const mainCategory = resolveToEnglishCategory(normalizeCategory(t.category || defaultCategory), type);
      acc[mainCategory] = (acc[mainCategory] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(categories)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);
};

export const StatusView: React.FC<StatusViewProps> = ({ transactions }) => {
  const filteredTransactions = transactions.filter(t => {
    const resolved = resolveToEnglishCategory(normalizeCategory(t.category || ''), t.type);
    return resolved !== 'internal_transfer';
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const topIncomeCategories = aggregateByCategory(filteredTransactions, 'income');
  const topExpenseCategories = aggregateByCategory(filteredTransactions, 'expense');

  const positiveIncomeTotal = topIncomeCategories.reduce((s, [, a]) => s + a, 0);
  const positiveExpenseTotal = topExpenseCategories.reduce((s, [, a]) => s + a, 0);

  // Monthly data — derive range from actual transaction dates
  const transactionDates = filteredTransactions.map(t => new Date(t.date));
  const earliestDate = transactionDates.length > 0 ? new Date(Math.min(...transactionDates.map(d => d.getTime()))) : new Date();
  const latestDate = transactionDates.length > 0 ? new Date(Math.max(...transactionDates.map(d => d.getTime()))) : new Date();
  const months = eachMonthOfInterval({ start: startOfMonth(earliestDate), end: endOfMonth(latestDate) });

  const monthlyData: MonthlyBarData[] = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const { income, expenses } = calculateMonthlyTotals(filteredTransactions, monthStart, monthEnd);

    const monthTransactions = filteredTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const categoryBreakdown = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const k = resolveToEnglishCategory(normalizeCategory(t.category || 'other_expense'), 'expense');
        acc[k] = (acc[k] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const incomeCategoryBreakdown = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const k = resolveToEnglishCategory(normalizeCategory(t.category || 'other_income'), 'income');
        acc[k] = (acc[k] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      month: format(month, 'MMM yyyy'),
      shortMonth: format(month, 'MMM'),
      income,
      expenses,
      categoryBreakdown,
      incomeCategoryBreakdown,
    };
  });

  const incomeSlices = topIncomeCategories.map(([cat, amt], i) => ({
    label: getCategoryDisplayName(cat),
    amount: amt,
    color: getIncomeCategoryColor(cat, i),
  }));

  const expenseSlices = topExpenseCategories.map(([cat, amt]) => ({
    label: getCategoryDisplayName(cat),
    amount: amt,
    color: getCategoryColor(cat),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Analytics Dashboard</h2>
        <p className="text-gray-600 mb-8">Visual insights into your income and expense patterns</p>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction data</h3>
            <p className="text-gray-600">Upload some transaction files to see your financial analytics.</p>
          </div>
        )}

        {filteredTransactions.length > 0 && (
          <>
            {/* Pie Charts */}
            <div className="flex flex-row gap-8 mb-8 items-center justify-center">
              {/* Income Pie */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center justify-center" style={{ width: '25%' }}>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                    <PieChart className="w-5 h-5 mr-2 text-cyan-600" />
                    Income Categories
                  </h3>
                  <p className="text-gray-600 text-xs">Breakdown of income sources</p>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <PieChartSVG
                    slices={incomeSlices}
                    total={positiveIncomeTotal}
                    centerLabel={`¥${Math.round(totalIncome / 1000)}k`}
                    centerColor="text-cyan-600"
                    borderColor="border-cyan-200"
                  />
                </div>
                <PieChartLegend
                  title="Income Sources"
                  items={incomeSlices}
                />
              </div>

              {/* Expense Pie */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center justify-center" style={{ width: '25%' }}>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                    <PieChart className="w-5 h-5 mr-2 text-red-600" />
                    Expense Categories
                  </h3>
                  <p className="text-gray-600 text-xs">Breakdown of spending by category</p>
                </div>
                <div className="flex items-center justify-center mb-2">
                  <PieChartSVG
                    slices={expenseSlices}
                    total={positiveExpenseTotal}
                    centerLabel={`¥${Math.round(totalExpenses / 1000)}k`}
                    centerColor="text-red-600"
                    borderColor="border-red-200"
                  />
                </div>
                <PieChartLegend
                  title="Expense Categories"
                  items={expenseSlices}
                  maxItems={10}
                />
              </div>
            </div>

            {/* Bar Chart */}
            <MonthlyBarChart data={monthlyData} />
          </>
        )}
      </div>
    </div>
  );
};
