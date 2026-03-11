import React, { useState, useMemo, useCallback } from 'react';
import { Settings, Search, Save, RotateCcw, Check } from 'lucide-react';
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Build dropdown options split by income/expense
  const { incomeDropdownOptions, expenseDropdownOptions } = useMemo(() => {
    const categories = categoryMapping.categories as { income?: string[]; expense?: string[] };
    const incomeMainCats = Array.isArray(categories.income) ? categories.income : [];
    const expenseMainCats = Array.isArray(categories.expense) ? categories.expense : [];
    return {
      incomeDropdownOptions: [...new Set([...Object.keys(incomeSubcategories), ...incomeMainCats])].sort(),
      expenseDropdownOptions: [...new Set([...Object.keys(expenseSubcategories), ...expenseMainCats])].sort(),
    };
  }, [incomeSubcategories, expenseSubcategories, categoryMapping.categories]);

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
          // Plain string: check if it resolves to "other" on its natural side
          const incResolved = resolveCategory(value, 'income');
          const expResolved = resolveCategory(value, 'expense');
          return incResolved === 'other_income' || expResolved === 'other_expense';
        }
        const incResolved = resolveCategory(value.income, 'income');
        const expResolved = resolveCategory(value.expense, 'expense');
        return incResolved === 'other_income' || expResolved === 'other_expense';
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
      const incCurrent = typeof current === 'string' ? current : current.income;
      const expCurrent = typeof current === 'string'
        ? (expenseDropdownOptions.includes(current) ? current : 'other_expense')
        : current.expense;

      const incNew = type === 'income' ? newCategory : incCurrent;
      const expNew = type === 'expense' ? newCategory : expCurrent;

      const newValue: MappingValue = incNew === expNew ? incNew : { income: incNew, expense: expNew };
      return { ...prev, [merchant]: newValue };
    });
    setHasUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    const updated = { ...categoryMapping, mappings };
    configLoader.saveCategoryMapping(updated);
    setCategoryMapping(updated);
    setHasUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDiscard = () => {
    const current = configLoader.getCategoryMapping();
    setMappings({ ...current.mappings });
    setCategoryMapping(current);
    setHasUnsavedChanges(false);
    setSaveSuccess(false);
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
            Others Only
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
          {saveSuccess && (
            <span className="flex items-center gap-1 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
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
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-1 px-5 py-2 text-sm font-bold border-2 border-black rounded transition-all ${
              hasUnsavedChanges
                ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
                : 'bg-yellow-100 text-gray-400 border-gray-300 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black rounded overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 border-b-2 border-black font-semibold">Merchant</th>
              <th className="text-left px-3 py-2 border-b-2 border-black font-semibold w-56">Income Subcategory</th>
              <th className="text-left px-3 py-2 border-b-2 border-black font-semibold w-56">Expense Subcategory</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(([merchant, value]) => {
              const rawValue = typeof value === 'string' ? value : null;
              const incRaw = rawValue ?? (value as { income: string; expense: string }).income;
              const expRaw = rawValue
                ? (expenseDropdownOptions.includes(rawValue) ? rawValue : 'other_expense')
                : (value as { income: string; expense: string }).expense;
              const incResolved = resolveCategory(incRaw, 'income');
              const expResolved = resolveCategory(expRaw, 'expense');

              return (
                <tr key={merchant} className="border-b border-gray-200 hover:bg-yellow-50">
                  <td className="px-3 py-2 font-mono text-xs break-all">{merchant}</td>
                  <td className="px-3 py-2">
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
                  <td className="px-3 py-2">
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
