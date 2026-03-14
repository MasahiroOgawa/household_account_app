import React from 'react';
import { BarChart3 } from 'lucide-react';
import { getCategoryColor, getIncomeCategoryColor } from '../../utils/category/categoryColors';
import { getCategoryDisplayName } from '../../utils/category/categoryDisplay';
import { formatAmount } from '../../utils/formatAmount';

export interface MonthlyBarData {
  month: string;
  shortMonth: string;
  income: number;
  expenses: number;
  categoryBreakdown: Record<string, number>;
  incomeCategoryBreakdown: Record<string, number>;
}

interface BarChartProps {
  data: MonthlyBarData[];
}

const getNiceRoundMax = (value: number): number => {
  if (value <= 100000) return 100000;
  if (value <= 250000) return 250000;
  if (value <= 500000) return 500000;
  if (value <= 1000000) return 1000000;
  if (value <= 1500000) return 1500000;
  if (value <= 2000000) return 2000000;
  if (value <= 2500000) return 2500000;
  if (value <= 3000000) return 3000000;
  if (value <= 5000000) return 5000000;
  return Math.ceil(value / 1000000) * 1000000;
};


export const MonthlyBarChart: React.FC<BarChartProps> = ({ data }) => {
  const rawMax = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 100);
  const maxAmount = getNiceRoundMax(rawMax);
  const chartHeight = 392;

  return (
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

      <div style={{ position: 'relative' }}>
        {/* Y-axis */}
        <div style={{ position: 'absolute', left: '0', top: '0', height: '400px', width: '80px', fontSize: '12px', color: '#6B7280', paddingRight: '8px' }}>
          <div style={{ textAlign: 'right', position: 'absolute', top: '0px' }}>¥{formatAmount(maxAmount)}</div>
          <div style={{ textAlign: 'right', position: 'absolute', top: '100px' }}>¥{formatAmount(maxAmount * 0.75)}</div>
          <div style={{ textAlign: 'right', position: 'absolute', top: '200px' }}>¥{formatAmount(maxAmount * 0.5)}</div>
          <div style={{ textAlign: 'right', position: 'absolute', top: '300px' }}>¥{formatAmount(maxAmount * 0.25)}</div>
          <div style={{ textAlign: 'right', position: 'absolute', bottom: '0px' }}>¥0</div>
        </div>

        {/* Chart area */}
        <div style={{
          marginLeft: '80px',
          borderLeft: '4px solid #6B7280',
          borderBottom: '4px solid #6B7280',
          backgroundColor: '#F9FAFB',
          borderBottomLeftRadius: '8px',
          overflowX: 'auto',
          maxWidth: '100%',
        }}>
          <div style={{ minWidth: 'fit-content' }}>
            {/* Bars */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              height: '400px', padding: '8px 16px 0 16px', gap: '8px', boxSizing: 'border-box',
            }}>
              {data.map((d, index) => {
                const incomeHeight = Math.max((d.income / maxAmount) * chartHeight, d.income > 0 ? 8 : 4);
                const categorySegments = Object.entries(d.categoryBreakdown || {})
                  .filter(([, amt]) => (amt as number) > 0)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([cat, amt]) => ({
                    category: cat,
                    amount: amt as number,
                    height: Math.max(((amt as number) / maxAmount) * chartHeight, 2),
                  }));
                const positiveExpenseSum = categorySegments.reduce((s, seg) => s + seg.amount, 0);
                const expenseHeight = Math.max((positiveExpenseSum / maxAmount) * chartHeight, positiveExpenseSum > 0 ? 8 : 4);

                return (
                  <div key={index} style={{
                    display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '0 4px',
                    backgroundColor: index % 2 === 0 ? 'rgba(243,244,246,0.3)' : 'transparent',
                    borderRadius: '6px 6px 0 0', minWidth: '80px', flex: '0 0 auto', height: '100%',
                  }}>
                    {/* Income bar */}
                    <div style={{
                      width: '30px', height: `${incomeHeight}px`, border: '2px solid #06b6d4',
                      borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer',
                      transition: 'all 0.2s ease', minHeight: '4px',
                      display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden', position: 'relative',
                    }} title={`Income: ¥${Math.round(d.income).toLocaleString()}`}>
                      {Object.entries(d.incomeCategoryBreakdown || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([cat, amt], si) => (
                          <div key={si} style={{
                            width: '100%',
                            height: `${Math.max(((amt as number) / maxAmount) * chartHeight, (amt as number) > 0 ? 2 : 0)}px`,
                            backgroundColor: getIncomeCategoryColor(cat, si),
                            borderTop: si > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                            flexShrink: 0,
                          }} title={`${getCategoryDisplayName(cat)}: ¥${Math.round(amt as number).toLocaleString()}`} />
                        ))}
                      {incomeHeight > 35 && d.income > 0 && (
                        <div style={{ position: 'absolute', top: '2px', left: '0', right: '0', textAlign: 'center', color: 'white', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          ¥{formatAmount(Math.round(d.income))}
                        </div>
                      )}
                    </div>

                    {/* Expense bar */}
                    <div style={{
                      width: '30px', height: `${expenseHeight}px`, border: '2px solid #9CA3AF',
                      borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer',
                      transition: 'all 0.2s ease', minHeight: '4px',
                      display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden', position: 'relative',
                    }} title={`Expenses: ¥${Math.round(positiveExpenseSum).toLocaleString()}`}>
                      {categorySegments.map((seg, si) => (
                        <div key={si} style={{
                          width: '100%', height: `${seg.height}px`,
                          backgroundColor: getCategoryColor(seg.category),
                          borderTop: si > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                          flexShrink: 0,
                        }} title={`${getCategoryDisplayName(seg.category)}: ¥${Math.round(seg.amount).toLocaleString()}`} />
                      ))}
                      {expenseHeight > 35 && positiveExpenseSum > 0 && (
                        <div style={{ position: 'absolute', top: '2px', left: '0', right: '0', textAlign: 'center', color: 'white', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          ¥{formatAmount(Math.round(positiveExpenseSum))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px 16px',
              backgroundColor: '#FFFFFF', borderTop: '2px solid #E5E7EB',
            }}>
              {data.map((d, index) => (
                <div key={index} style={{ minWidth: '80px', textAlign: 'center', flex: '0 0 auto', padding: '0 4px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginBottom: '6px' }}>
                    {d.shortMonth}
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px',
                    backgroundColor: (d.income - d.expenses) >= 0 ? '#E0F2FE' : '#FEE2E2',
                    color: (d.income - d.expenses) >= 0 ? '#0C4A6E' : '#991B1B',
                    border: `1px solid ${(d.income - d.expenses) >= 0 ? '#BAE6FD' : '#FECACA'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {(d.income - d.expenses) >= 0 ? '+' : ''}¥{Math.abs(d.income - d.expenses).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
