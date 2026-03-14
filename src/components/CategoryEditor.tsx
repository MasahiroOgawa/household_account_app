import React, { useState, useMemo, useCallback } from 'react';
import { Settings, Search, RotateCcw, Download } from 'lucide-react';
import { configLoader } from '../utils/config/configLoader';
import { getCategoryDisplayName } from '../utils/category/categoryDisplay';
import { getCategoryColor } from '../utils/category/categoryColors';

type MappingValue = string | { income: string; expense: string };

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
    style={{ backgroundColor: getCategoryColor(category) }}
  >
    {getCategoryDisplayName(category)}
  </span>
);

export const CategoryEditor: React.FC = () => {
  const [categoryMapping, setCategoryMapping] = useState(() => configLoader.getCategoryMapping());
  type SplitSubs = { income: Record<string, string>; expense: Record<string, string> };
  const emptySubs = {} as Record<string, string>;
  const { incomeSubcategories, expenseSubcategories } = useMemo(() => {
    const subs = categoryMapping.subcategories;
    if (!subs) return { incomeSubcategories: emptySubs, expenseSubcategories: emptySubs };
    if ('income' in subs && 'expense' in subs) {
      const split = subs as SplitSubs;
      return { incomeSubcategories: split.income, expenseSubcategories: split.expense };
    }
    const flat = subs as Record<string, string>;
    return { incomeSubcategories: flat, expenseSubcategories: flat };
  }, [categoryMapping.subcategories]);

  const [mappings, setMappings] = useState<Record<string, MappingValue>>(
    () => ({ ...categoryMapping.mappings })
  );
  const [filterMode, setFilterMode] = useState<'others' | 'all'>('others');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Build dropdown options split by income/expense
  const { incomeDropdownOptions, expenseDropdownOptions } = useMemo(() => {
    return {
      incomeDropdownOptions: Object.keys(incomeSubcategories).sort(),
      expenseDropdownOptions: Object.keys(expenseSubcategories).sort(),
    };
  }, [incomeSubcategories, expenseSubcategories]);

  const resolveCategory = useCallback(
    (raw: string, type: 'income' | 'expense') => {
      const subcatMap = type === 'income' ? incomeSubcategories : expenseSubcategories;
      return subcatMap[raw] || raw;
    },
    [incomeSubcategories, expenseSubcategories]
  );

  const filteredEntries = useMemo(() => {
    let entries = Object.entries(mappings);

    if (filterMode === 'others') {
      entries = entries.filter(([, value]) => {
        if (typeof value === 'string') {
          return resolveCategory(value, 'expense') === 'other_expense';
        }
        return resolveCategory(value.expense, 'expense') === 'other_expense';
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([merchant]) =>
        merchant.toLowerCase().includes(q)
      );
    }

    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [mappings, filterMode, searchQuery, resolveCategory]);

  const handleChange = (
    merchant: string,
    type: 'income' | 'expense',
    newCategory: string
  ) => {
    setMappings(prev => {
      const current = prev[merchant];
      const incCurrent = typeof current === 'string'
        ? (incomeDropdownOptions.includes(current) ? current : 'other_income')
        : current.income;
      const expCurrent = typeof current === 'string'
        ? (expenseDropdownOptions.includes(current) ? current : 'other_expense')
        : current.expense;

      const incNew = type === 'income' ? newCategory : incCurrent;
      const expNew = type === 'expense' ? newCategory : expCurrent;

      const newValue: MappingValue = incNew === expNew ? incNew : { income: incNew, expense: expNew };
      return { ...prev, [merchant]: newValue };
    });
    setHasUnsavedChanges(true);
  };

  const handleDiscard = () => {
    const current = configLoader.getCategoryMapping();
    setMappings({ ...current.mappings });
    setCategoryMapping(current);
    setHasUnsavedChanges(false);
  };

  const handleDownload = () => {
    const current = { ...categoryMapping, mappings };
    const json = JSON.stringify(current, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categoryMapping.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6" />
          <h2 className="text-2xl font-bold text-black">Category Mapping Editor</h2>
        </div>
        <p className="text-sm text-gray-600">
          Assign subcategories to merchant descriptions. Each merchant can have different subcategories for income and expense. Subcategories are automatically grouped into main categories.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex border-2 border-black rounded overflow-hidden">
          <button
            onClick={() => setFilterMode('others')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              filterMode === 'others'
                ? 'bg-yellow-300 text-black'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Other Expense Only
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-1.5 text-sm font-medium border-l-2 border-black transition-colors ${
              filterMode === 'all'
                ? 'bg-yellow-300 text-black'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            All
          </button>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border-2 border-black rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <span className="px-3 py-1 bg-gray-200 border-2 border-black rounded text-sm font-medium">
          {filteredEntries.length} items
        </span>

        <div className="flex gap-2 ml-auto items-center">
          <button
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium border-2 border-black rounded transition-all ${
              hasUnsavedChanges
                ? 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
                : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Discard
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-4 py-1.5 text-sm font-bold bg-blue-100 text-blue-800 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black rounded overflow-auto max-h-[60vh]" style={{ resize: 'horizontal' }}>
        <table className="w-full text-sm table-fixed" style={{ borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '35%' }} />
          </colgroup>
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="text-left px-2 py-2 border-b-2 border-black border-r border-gray-400 font-semibold">Merchant</th>
              <th className="text-left px-2 py-2 border-b-2 border-black border-r border-gray-400 font-semibold">Income Subcategory</th>
              <th className="text-left px-2 py-2 border-b-2 border-black font-semibold">Expense Subcategory</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(([merchant, value], index) => {
              const rawValue = typeof value === 'string' ? value : null;
              const incRaw = rawValue
                ? (incomeDropdownOptions.includes(rawValue) ? rawValue : 'other_income')
                : (value as { income: string; expense: string }).income;
              const expRaw = rawValue
                ? (expenseDropdownOptions.includes(rawValue) ? rawValue : 'other_expense')
                : (value as { income: string; expense: string }).expense;
              const incResolved = resolveCategory(incRaw, 'income');
              const expResolved = resolveCategory(expRaw, 'expense');

              return (
                <tr key={merchant} className={`hover:bg-yellow-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-2 py-1.5 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" style={{ borderBottom: '1px solid #9ca3af', borderRight: '1px solid #9ca3af' }} title={merchant}>{merchant}</td>
                  <td className="px-2 py-1.5" style={{ borderBottom: '1px solid #9ca3af', borderRight: '1px solid #9ca3af' }}>
                    <div className="flex items-center gap-2">
                      <select
                        value={incRaw}
                        onChange={e => handleChange(merchant, 'income', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-yellow-300"
                      >
                        {incomeDropdownOptions.map(cat => (
                          <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                        ))}
                        {!incomeDropdownOptions.includes(incRaw) && (
                          <option value={incRaw}>{getCategoryDisplayName(incRaw)}</option>
                        )}
                      </select>
                      <CategoryBadge category={incResolved} />
                    </div>
                  </td>
                  <td className="px-2 py-1.5" style={{ borderBottom: '1px solid #9ca3af' }}>
                    <div className="flex items-center gap-2">
                      <select
                        value={expRaw}
                        onChange={e => handleChange(merchant, 'expense', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-yellow-300"
                      >
                        {expenseDropdownOptions.map(cat => (
                          <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                        ))}
                        {!expenseDropdownOptions.includes(expRaw) && (
                          <option value={expRaw}>{getCategoryDisplayName(expRaw)}</option>
                        )}
                      </select>
                      <CategoryBadge category={expResolved} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                  No matching merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
