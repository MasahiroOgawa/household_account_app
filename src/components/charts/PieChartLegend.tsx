import React from 'react';

interface LegendItem {
  label: string;
  amount: number;
  color: string;
}

interface PieChartLegendProps {
  title: string;
  items: LegendItem[];
  maxItems?: number;
}

export const PieChartLegend: React.FC<PieChartLegendProps> = ({ title, items, maxItems }) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const remaining = maxItems ? items.length - maxItems : 0;

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-xs font-semibold text-gray-700 mb-2">{title}:</p>
      <div className="space-y-1">
        {displayItems.map((item) => (
          <div key={item.label} className="flex items-center" style={{ fontSize: '11px' }}>
            <div
              className="flex-shrink-0"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: item.color,
                marginRight: '6px',
                borderRadius: '2px',
              }}
            />
            <span className="flex-1" style={{ color: '#374151', fontWeight: '500' }}>
              {item.label}
            </span>
            <span style={{ color: '#111827', fontWeight: '600', marginLeft: '8px' }}>
              ¥{Math.round(item.amount).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-gray-500 mt-2">+{remaining} more</p>
      )}
    </div>
  );
};
