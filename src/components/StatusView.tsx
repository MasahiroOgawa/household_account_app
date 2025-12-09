import React from 'react';
import { Transaction } from '../types/Transaction';
import { BarChart3, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { calculateMonthlyTotals } from '../utils/monthlyCalculations';
import { getCategoryColor, getCategoryDisplayName, getIncomeCategoryColor, NewCategory } from '../utils/categoryHelpers';

interface StatusViewProps {
  transactions: Transaction[];
}

export const StatusView: React.FC<StatusViewProps> = ({ transactions }) => {
  // Filter out internal_transfer transactions
  const filteredTransactions = transactions.filter(t => t.category !== 'internal_transfer');

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Income category breakdown
  const incomeCategories = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const normalizedCategory = t.category.toLowerCase().trim();
      acc[normalizedCategory] = (acc[normalizedCategory] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Filter to only positive amounts for pie chart display
  const topIncomeCategories = Object.entries(incomeCategories)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  // Calculate positive income total for pie chart percentages
  const positiveIncomeTotal = topIncomeCategories.reduce((sum, [, amount]) => sum + amount, 0);



  // Expense category breakdown
  const expenseCategories = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const normalizedCategory = t.category.toLowerCase().trim();
      acc[normalizedCategory] = (acc[normalizedCategory] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Filter to only positive amounts for pie chart display
  const topExpenseCategories = Object.entries(expenseCategories)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  // Calculate positive expense total for pie chart percentages
  const positiveExpenseTotal = topExpenseCategories.reduce((sum, [, amount]) => sum + amount, 0);



  // Monthly breakdown for the previous 12 months
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 11);
  const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now });

  interface MonthlyDataItem {
    month: string;
    shortMonth: string;
    income: number;
    expenses: number;
    categoryBreakdown: Record<string, number>;
    incomeCategoryBreakdown: Record<string, number>;
  }

  const monthlyData: MonthlyDataItem[] = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const { income, expenses } = calculateMonthlyTotals(filteredTransactions, monthStart, monthEnd);

    // Calculate category breakdown for this month
    const monthTransactions = filteredTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const monthlyExpenseCategories = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const normalizedCategory = t.category.toLowerCase().trim();
        acc[normalizedCategory] = (acc[normalizedCategory] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const monthlyIncomeCategories = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const normalizedCategory = t.category.toLowerCase().trim();
        acc[normalizedCategory] = (acc[normalizedCategory] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      month: format(month, 'MMM yyyy'),
      shortMonth: format(month, 'MMM'),
      income,
      expenses,
      categoryBreakdown: monthlyExpenseCategories,
      incomeCategoryBreakdown: monthlyIncomeCategories
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Analytics Dashboard</h2>
        <p className="text-gray-600 mb-8">Visual insights into your income and expense patterns</p>

        {/* Show message if no data */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction data</h3>
            <p className="text-gray-600">Upload some transaction files to see your financial analytics.</p>
          </div>
        )}

        {/* Only show charts if we have data */}
        {filteredTransactions.length > 0 && (
          <>
            {/* Calculate max amount for scaling */}
            {(() => {
              const rawMaxAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)), 100);

              // Helper function to create nice round numbers for Y-axis
              const getNiceRoundMax = (value: number): number => {
                if (value <= 100000) return 100000; // 100k
                if (value <= 250000) return 250000; // 250k
                if (value <= 500000) return 500000; // 0.5M
                if (value <= 1000000) return 1000000; // 1M
                if (value <= 1500000) return 1500000; // 1.5M
                if (value <= 2000000) return 2000000; // 2M
                if (value <= 2500000) return 2500000; // 2.5M
                if (value <= 3000000) return 3000000; // 3M
                if (value <= 5000000) return 5000000; // 5M
                // For larger amounts, round up to nearest million
                return Math.ceil(value / 1000000) * 1000000;
              };

              const maxMonthlyAmount = getNiceRoundMax(rawMaxAmount);

              // Helper function to format amounts nicely
              const formatAmount = (amount: number): string => {
                if (amount >= 1000000) {
                  const millions = amount / 1000000;
                  return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
                } else if (amount >= 1000) {
                  const thousands = amount / 1000;
                  return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(0)}k`;
                } else {
                  return amount.toString();
                }
              };

              return (
                <>
                  {/* First Row: Pie Charts */}
                  <div className="flex flex-row gap-8 mb-8 items-center justify-center">
                    {/* Graph 1: Income Category Breakdown */}
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center justify-center" style={{ width: '25%' }}>
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                          <PieChart className="w-5 h-5 mr-2 text-cyan-600" />
                          Income Categories
                        </h3>
                        <p className="text-gray-600 text-xs">Breakdown of income sources</p>
                      </div>

                      <div className="flex items-center justify-center mb-2">
                        <div className="relative">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            {topIncomeCategories.length > 0 ? topIncomeCategories.map(([category, amount], index) => {
                              const percentage = positiveIncomeTotal > 0 ? (amount / positiveIncomeTotal) * 100 : 0;
                              const categoryColor = getIncomeCategoryColor(category, index);
                              const radius = 30;
                              const circumference = 2 * Math.PI * radius;
                              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                              const strokeDashoffset = -topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + ((amt / positiveIncomeTotal) * circumference), 0);

                              return (
                                <g key={category}>
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="30"
                                    fill="transparent"
                                    stroke={categoryColor}
                                    strokeWidth="15"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                  >
                                    <title>{`${getCategoryDisplayName(category as NewCategory)}: ¥${Math.round(amount).toLocaleString()} (${percentage.toFixed(1)}%)`}</title>
                                  </circle>
                                </g>
                              );
                            }) : (
                              <circle
                                cx="50"
                                cy="50"
                                r="30"
                                fill="transparent"
                                stroke="#E5E7EB"
                                strokeWidth="15"
                              />
                            )}
                          </svg>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center bg-white rounded-full w-10 h-10 flex flex-col items-center justify-center shadow-lg border border-cyan-200">
                              <div className="text-sm font-bold text-cyan-600">¥{Math.round(totalIncome / 1000)}k</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Income Category Legend */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Income Sources:</p>
                        <div className="space-y-1">
                          {topIncomeCategories.map(([category, amount], index) => {
                            const categoryColor = getIncomeCategoryColor(category, index);
                            return (
                              <div key={category} className="flex items-center" style={{ fontSize: '11px' }}>
                                <div
                                  className="flex-shrink-0"
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: categoryColor,
                                    marginRight: '6px',
                                    borderRadius: '2px'
                                  }}
                                />
                                <span className="flex-1" style={{ color: '#374151', fontWeight: '500' }}>
                                  {getCategoryDisplayName(category as NewCategory)}
                                </span>
                                <span style={{ color: '#111827', fontWeight: '600', marginLeft: '8px' }}>
                                  ¥{Math.round(amount).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Graph 2: Expense Category Breakdown */}
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center justify-center" style={{ width: '25%' }}>
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                          <PieChart className="w-5 h-5 mr-2 text-red-600" />
                          Expense Categories
                        </h3>
                        <p className="text-gray-600 text-xs">Breakdown of spending by category</p>
                      </div>

                      <div className="flex items-center justify-center mb-2">
                        <div className="relative">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            {/* First render all the pie slices */}
                            {topExpenseCategories.length > 0 ? (
                              <>
                                {topExpenseCategories.map(([category, amount], index) => {
                                  const percentage = positiveExpenseTotal > 0 ? (amount / positiveExpenseTotal) * 100 : 0;
                                  // Use actual category colors for consistency
                                  const categoryColor = getCategoryColor(category as NewCategory);
                                  const radius = 30;
                                  const circumference = 2 * Math.PI * radius;
                                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                                  const strokeDashoffset = -topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + ((amt / positiveExpenseTotal) * circumference), 0);

                                  return (
                                    <circle
                                      key={`slice-${category}`}
                                      cx="50"
                                      cy="50"
                                      r="30"
                                      fill="transparent"
                                      stroke={categoryColor}
                                      strokeWidth="15"
                                      strokeDasharray={strokeDasharray}
                                      strokeDashoffset={strokeDashoffset}
                                      className="hover:opacity-80 transition-opacity cursor-pointer"
                                    >
                                      <title>{`${getCategoryDisplayName(category as NewCategory)}: ¥${Math.round(amount).toLocaleString()} (${percentage.toFixed(1)}%)`}</title>
                                    </circle>
                                  );
                                })}
                              </>
                            ) : (
                              <circle
                                cx="50"
                                cy="50"
                                r="30"
                                fill="transparent"
                                stroke="#E5E7EB"
                                strokeWidth="15"
                              />
                            )}
                          </svg>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center bg-white rounded-full w-10 h-10 flex flex-col items-center justify-center shadow-lg border border-red-200">
                              <div className="text-sm font-bold text-red-600">¥{Math.round(totalExpenses / 1000)}k</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expense Category Legend */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Expense Categories:</p>
                        <div className="space-y-1">
                          {topExpenseCategories.slice(0, 10).map(([category, amount]) => {
                            const categoryColor = getCategoryColor(category as NewCategory);
                            return (
                              <div key={category} className="flex items-center" style={{ fontSize: '11px' }}>
                                <div
                                  className="flex-shrink-0"
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: categoryColor,
                                    marginRight: '6px',
                                    borderRadius: '2px'
                                  }}
                                />
                                <span className="flex-1" style={{ color: '#374151', fontWeight: '500' }}>
                                  {getCategoryDisplayName(category as NewCategory)}
                                </span>
                                <span style={{ color: '#111827', fontWeight: '600', marginLeft: '8px' }}>
                                  ¥{Math.round(amount).toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {topExpenseCategories.length > 10 && (
                          <p className="text-xs text-gray-500 mt-2">+{topExpenseCategories.length - 10} more</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Graph 3: Monthly Bar Chart */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-2">
                        <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
                        Monthly Income vs Expenses
                      </h3>
                      <p className="text-gray-600">Side-by-side comparison of monthly income and expenses over the last 12 months</p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gradient-to-t from-green-400 to-blue-400 rounded mr-1"></div>
                          <span className="text-gray-600">Income (stacked by category)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gradient-to-t from-gray-400 to-purple-400 rounded mr-1"></div>
                          <span className="text-gray-600">Expenses (stacked by category)</span>
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart Container */}
                    <div style={{ position: 'relative' }}>
                      {/* Y-axis labels */}
                      <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        height: '400px',
                        width: '80px',
                        fontSize: '12px',
                        color: '#6B7280',
                        paddingRight: '8px'
                      }}>
                        {/* Top label (100%) */}
                        <div style={{ textAlign: 'right', position: 'absolute', top: '0px' }}>¥{formatAmount(maxMonthlyAmount)}</div>
                        {/* 75% label */}
                        <div style={{ textAlign: 'right', position: 'absolute', top: '100px' }}>¥{formatAmount(maxMonthlyAmount * 0.75)}</div>
                        {/* 50% label */}
                        <div style={{ textAlign: 'right', position: 'absolute', top: '200px' }}>¥{formatAmount(maxMonthlyAmount * 0.5)}</div>
                        {/* 25% label */}
                        <div style={{ textAlign: 'right', position: 'absolute', top: '300px' }}>¥{formatAmount(maxMonthlyAmount * 0.25)}</div>
                        {/* Bottom label (0%) - positioned at the very bottom */}
                        <div style={{ textAlign: 'right', position: 'absolute', bottom: '0px' }}>¥0</div>
                      </div>

                      {/* Chart Container with scrollable wrapper */}
                      <div style={{
                        marginLeft: '80px',
                        borderLeft: '4px solid #6B7280',
                        borderBottom: '4px solid #6B7280',
                        backgroundColor: '#F9FAFB',
                        borderBottomLeftRadius: '8px',
                        overflowX: 'auto',
                        maxWidth: '100%'
                      }}>
                        {/* Inner container for both bars and labels */}
                        <div style={{
                          minWidth: 'fit-content'
                        }}>
                          {/* Bars Area - bars start from bottom */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            height: '400px',
                            padding: '8px 16px 0 16px', // No bottom padding so bars touch bottom
                            gap: '8px',
                            boxSizing: 'border-box'
                          }}>
                            {monthlyData.map((data, index) => {
                              // Calculate bar heights (minimum 8px for visibility)
                              const incomeHeight = Math.max((data.income / maxMonthlyAmount) * 392, data.income > 0 ? 8 : 4); // Use full 392px height
                              const expenseHeight = Math.max((data.expenses / maxMonthlyAmount) * 392, data.expenses > 0 ? 8 : 4);

                              // Calculate category segments for expense bar - filter positive amounts only
                              const categorySegments = Object.entries(data.categoryBreakdown || {})
                                .filter(([, amount]) => (amount as number) > 0)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([category, amount]) => ({
                                  category,
                                  amount: amount as number,
                                  height: Math.max(((amount as number) / maxMonthlyAmount) * 392, 2)
                                }));

                              // Calculate actual positive expense total for bar height
                              const positiveExpenseSum = categorySegments.reduce((sum, seg) => sum + seg.amount, 0);
                              const adjustedExpenseHeight = Math.max((positiveExpenseSum / maxMonthlyAmount) * 392, positiveExpenseSum > 0 ? 8 : 4);

                              return (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  gap: '4px',
                                  padding: '0 4px',
                                  backgroundColor: index % 2 === 0 ? 'rgba(243, 244, 246, 0.3)' : 'transparent',
                                  borderRadius: '6px 6px 0 0', // Only top corners rounded
                                  minWidth: '80px',
                                  flex: '0 0 auto',
                                  height: '100%' // Take full height so bars start from bottom
                                }}>
                                  {/* Income Bar - Stacked by Category */}
                                  <div style={{
                                    width: '30px',
                                    height: `${incomeHeight}px`,
                                    border: '2px solid #06b6d4',
                                    borderTopLeftRadius: '6px',
                                    borderTopRightRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minHeight: '4px',
                                    display: 'flex',
                                    flexDirection: 'column-reverse',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }} title={`Income: ¥${Math.round(data.income).toLocaleString()}`}>
                                    {/* Stack income category segments */}
                                    {Object.entries(data.incomeCategoryBreakdown || {})
                                      .sort(([, a], [, b]) => (b as number) - (a as number))
                                      .map(([category, amount], segIndex) => {
                                        const categoryColor = getIncomeCategoryColor(category, segIndex);
                                        return (
                                          <div
                                            key={segIndex}
                                            style={{
                                              width: '100%',
                                              height: `${Math.max(((amount as number) / maxMonthlyAmount) * 392, (amount as number) > 0 ? 2 : 0)}px`,
                                              backgroundColor: categoryColor,
                                              borderTop: segIndex > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                              flexShrink: 0
                                            }}
                                            title={`${getCategoryDisplayName(category as NewCategory)}: ¥${Math.round(amount as number).toLocaleString()}`}
                                          />
                                        );
                                      })}
                                    {/* Show total on top if there's space */}
                                    {incomeHeight > 35 && data.income > 0 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: '0',
                                        right: '0',
                                        textAlign: 'center',
                                        color: 'white',
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                      }}>
                                        ¥{Math.round(data.income / 1000)}k
                                      </div>
                                    )}
                                  </div>

                                  {/* Expense Bar - Stacked by Category */}
                                  <div style={{
                                    width: '30px',
                                    height: `${adjustedExpenseHeight}px`,
                                    border: '2px solid #9CA3AF',
                                    borderTopLeftRadius: '6px',
                                    borderTopRightRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minHeight: '4px',
                                    display: 'flex',
                                    flexDirection: 'column-reverse',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }} title={`Expenses: ¥${Math.round(positiveExpenseSum).toLocaleString()}`}>
                                    {/* Stack category segments */}
                                    {categorySegments.map((segment, segIndex) => (
                                      <div
                                        key={segIndex}
                                        style={{
                                          width: '100%',
                                          height: `${segment.height}px`,
                                          backgroundColor: getCategoryColor(segment.category as NewCategory),
                                          borderTop: segIndex > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                          flexShrink: 0
                                        }}
                                        title={`${getCategoryDisplayName(segment.category as NewCategory)}: ¥${Math.round(segment.amount).toLocaleString()}`}
                                      />
                                    ))}
                                    {/* Show total on top if there's space */}
                                    {adjustedExpenseHeight > 35 && positiveExpenseSum > 0 && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        left: '0',
                                        right: '0',
                                        textAlign: 'center',
                                        color: 'white',
                                        fontSize: '9px',
                                        fontWeight: 'bold',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                      }}>
                                        ¥{Math.round(positiveExpenseSum / 1000)}k
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* X-axis labels area - inside the scrollable container */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 16px',
                            backgroundColor: '#FFFFFF',
                            borderTop: '2px solid #E5E7EB'
                          }}>
                            {monthlyData.map((data, index) => (
                              <div key={index} style={{
                                minWidth: '80px',
                                textAlign: 'center',
                                flex: '0 0 auto',
                                padding: '0 4px'
                              }}>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginBottom: '6px' }}>
                                  {data.shortMonth}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  backgroundColor: (data.income - data.expenses) >= 0 ? '#E0F2FE' : '#FEE2E2',
                                  color: (data.income - data.expenses) >= 0 ? '#0C4A6E' : '#991B1B',
                                  border: `1px solid ${(data.income - data.expenses) >= 0 ? '#BAE6FD' : '#FECACA'}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {(data.income - data.expenses) >= 0 ? '+' : ''}¥{Math.abs(data.income - data.expenses).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};