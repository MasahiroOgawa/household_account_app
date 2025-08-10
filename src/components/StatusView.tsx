import React from 'react';
import { Transaction } from '../types/Transaction';
import { BarChart3, PieChart } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface StatusViewProps {
  transactions: Transaction[];
}

export const StatusView: React.FC<StatusViewProps> = ({ transactions }) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Income category breakdown
  const incomeCategories = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topIncomeCategories = Object.entries(incomeCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Expense category breakdown
  const expenseCategories = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topExpenseCategories = Object.entries(expenseCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Monthly breakdown for the previous 12 months
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 11);
  const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now });

  const monthlyData = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: format(month, 'MMM yyyy'),
      shortMonth: format(month, 'MMM'),
      income,
      expenses
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Analytics Dashboard</h2>
        <p className="text-gray-600 mb-8">Visual insights into your income and expense patterns</p>

        {/* Show message if no data */}
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction data</h3>
            <p className="text-gray-600">Upload some transaction files to see your financial analytics.</p>
          </div>
        )}

        {/* Only show charts if we have data */}
        {transactions.length > 0 && (
          <>
            {/* Calculate max amount for scaling */}
            {(() => {
              const maxMonthlyAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)), 100);

              return (
                <>
                  {/* First Row: Pie Charts */}
                  <div className="flex flex-row gap-8 mb-8 items-center justify-center">
                    {/* Graph 1: Income Category Breakdown */}
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex flex-col items-center justify-center" style={{ width: '25%' }}>
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
                          <PieChart className="w-5 h-5 mr-2 text-green-600" />
                          Income Categories
                        </h3>
                        <p className="text-gray-600 text-xs">Breakdown of income sources</p>
                      </div>

                      <div className="flex items-center justify-center mb-2">
                        <div className="relative">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                            {topIncomeCategories.length > 0 ? topIncomeCategories.map(([category, amount], index) => {
                              const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                              const colors = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022C22'];
                              const circumference = 2 * Math.PI * 15;
                              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                              const strokeDashoffset = -topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + ((amt / totalIncome) * circumference), 0);

                              return (
                                <g key={category}>
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="30"
                                    fill="transparent"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="15"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                  {/* Add category text on each segment if it's large enough */}
                                  {percentage > 10 && (
                                    <text
                                      x={50 + 20 * Math.cos((2 * Math.PI * (topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalIncome), 0) + (amount / totalIncome) / 2)) - Math.PI / 2)}
                                      y={50 + 20 * Math.sin((2 * Math.PI * (topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalIncome), 0) + (amount / totalIncome) / 2)) - Math.PI / 2)}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className="fill-white"
                                      style={{ fontSize: '2px', fontWeight: 'bold' }}
                                      transform={`rotate(90 ${50 + 20 * Math.cos((2 * Math.PI * (topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalIncome), 0) + (amount / totalIncome) / 2)) - Math.PI / 2)} ${50 + 20 * Math.sin((2 * Math.PI * (topIncomeCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalIncome), 0) + (amount / totalIncome) / 2)) - Math.PI / 2)})`}
                                    >
                                      {category.length > 8 ? category.substring(0, 8) : category}
                                    </text>
                                  )}
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
                            <div className="text-center bg-white rounded-full w-8 h-8 flex flex-col items-center justify-center shadow-lg border border-green-200">
                              <div className="text-xs font-bold text-green-600">¥{Math.round(totalIncome / 1000)}k</div>
                              <div className="text-[8px] text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {/* Hide category list for compact view */}
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
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                            {topExpenseCategories.length > 0 ? topExpenseCategories.map(([category, amount], index) => {
                              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                              const colors = ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'];
                              const circumference = 2 * Math.PI * 15;
                              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                              const strokeDashoffset = -topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + ((amt / totalExpenses) * circumference), 0);

                              return (
                                <g key={category}>
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="30"
                                    fill="transparent"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="15"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                  {/* Add category text on each segment if it's large enough */}
                                  {percentage > 10 && (
                                    <text
                                      x={50 + 20 * Math.cos((2 * Math.PI * (topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalExpenses), 0) + (amount / totalExpenses) / 2)) - Math.PI / 2)}
                                      y={50 + 20 * Math.sin((2 * Math.PI * (topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalExpenses), 0) + (amount / totalExpenses) / 2)) - Math.PI / 2)}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className="fill-white"
                                      style={{ fontSize: '2px', fontWeight: 'bold' }}
                                      transform={`rotate(90 ${50 + 20 * Math.cos((2 * Math.PI * (topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalExpenses), 0) + (amount / totalExpenses) / 2)) - Math.PI / 2)} ${50 + 20 * Math.sin((2 * Math.PI * (topExpenseCategories.slice(0, index).reduce((acc, [, amt]) => acc + (amt / totalExpenses), 0) + (amount / totalExpenses) / 2)) - Math.PI / 2)})`}
                                    >
                                      {category.length > 8 ? category.substring(0, 8) : category}
                                    </text>
                                  )}
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
                            <div className="text-center bg-white rounded-full w-8 h-8 flex flex-col items-center justify-center shadow-lg border border-red-200">
                              <div className="text-xs font-bold text-red-600">¥{Math.round(totalExpenses / 1000)}k</div>
                              <div className="text-[8px] text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {/* Hide category list for compact view */}
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
                      <p className="text-gray-600">Side-by-side comparison of monthly income and expenses over the last 6 months</p>
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
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#6B7280',
                        paddingRight: '8px'
                      }}>
                        <div style={{ textAlign: 'right' }}>¥{Math.round(maxMonthlyAmount / 1000)}k</div>
                        <div style={{ textAlign: 'right' }}>¥{Math.round(maxMonthlyAmount * 0.75 / 1000)}k</div>
                        <div style={{ textAlign: 'right' }}>¥{Math.round(maxMonthlyAmount * 0.5 / 1000)}k</div>
                        <div style={{ textAlign: 'right' }}>¥{Math.round(maxMonthlyAmount * 0.25 / 1000)}k</div>
                        <div style={{ textAlign: 'right' }}>¥0</div>
                      </div>

                      {/* Chart Container */}
                      <div style={{
                        marginLeft: '80px',
                        borderLeft: '4px solid #6B7280',
                        borderBottom: '4px solid #6B7280',
                        backgroundColor: '#F9FAFB',
                        borderBottomLeftRadius: '8px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-around',
                          height: '400px',
                          padding: '16px'
                        }}>
                          {monthlyData.map((data, index) => {
                            // Calculate bar heights (minimum 8px for visibility)
                            const incomeHeight = Math.max((data.income / maxMonthlyAmount) * 320, data.income > 0 ? 8 : 4);
                            const expenseHeight = Math.max((data.expenses / maxMonthlyAmount) * 320, data.expenses > 0 ? 8 : 4);

                            return (
                              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Bar pair container */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                                  {/* Income Bar - GREEN */}
                                  <div style={{
                                    width: '50px',
                                    height: `${incomeHeight}px`,
                                    backgroundColor: '#10B981',
                                    border: '2px solid #059669',
                                    borderTopLeftRadius: '4px',
                                    borderTopRightRadius: '4px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    minHeight: '4px',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    paddingBottom: '4px'
                                  }}>
                                    {incomeHeight > 40 && data.income > 0 && `¥${Math.round(data.income / 1000)}k`}
                                  </div>

                                  {/* Expense Bar - RED */}
                                  <div style={{
                                    width: '50px',
                                    height: `${expenseHeight}px`,
                                    backgroundColor: '#EF4444',
                                    border: '2px solid #DC2626',
                                    borderTopLeftRadius: '4px',
                                    borderTopRightRadius: '4px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    minHeight: '4px',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    paddingBottom: '4px'
                                  }}>
                                    {expenseHeight > 40 && data.expenses > 0 && `¥${Math.round(data.expenses / 1000)}k`}
                                  </div>
                                </div>

                                {/* Month label and net amount */}
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937', marginBottom: '4px' }}>
                                    {data.shortMonth}
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    padding: '4px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: (data.income - data.expenses) >= 0 ? '#DCFCE7' : '#FEE2E2',
                                    color: (data.income - data.expenses) >= 0 ? '#166534' : '#991B1B',
                                    border: `1px solid ${(data.income - data.expenses) >= 0 ? '#BBF7D0' : '#FECACA'}`
                                  }}>
                                    {(data.income - data.expenses) >= 0 ? '+' : ''}¥{(data.income - data.expenses).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '32px',
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#10B981',
                          border: '2px solid #059669',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}></div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>Income</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Total: ¥{totalIncome.toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#EF4444',
                          border: '2px solid #DC2626',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}></div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>Expenses</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Total: ¥{totalExpenses.toLocaleString()}</div>
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