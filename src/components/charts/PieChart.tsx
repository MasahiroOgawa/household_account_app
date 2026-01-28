import React from 'react';

interface PieSlice {
  label: string;
  amount: number;
  color: string;
}

interface PieChartProps {
  slices: PieSlice[];
  total: number;
  centerLabel: string;
  centerColor: string;
  borderColor: string;
}

export const PieChartSVG: React.FC<PieChartProps> = ({ slices, total, centerLabel, centerColor, borderColor }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        {slices.length > 0 ? slices.map((slice, index) => {
          const percentage = total > 0 ? (slice.amount / total) * 100 : 0;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -slices.slice(0, index).reduce(
            (acc, s) => acc + ((s.amount / total) * circumference), 0
          );

          return (
            <circle
              key={slice.label}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth="15"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <title>{`${slice.label}: ¥${Math.round(slice.amount).toLocaleString()} (${percentage.toFixed(1)}%)`}</title>
            </circle>
          );
        }) : (
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#E5E7EB" strokeWidth="15" />
        )}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-center bg-white rounded-full w-10 h-10 flex flex-col items-center justify-center shadow-lg border ${borderColor}`}>
          <div className={`text-sm font-bold ${centerColor}`}>{centerLabel}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  );
};
