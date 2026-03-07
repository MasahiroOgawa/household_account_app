import React, { useState, useMemo } from 'react';
import { Settings, Search, Save, RotateCcw } from 'lucide-react';
import { configLoader } from '../utils/config/configLoader';
import { getCategoryDisplayName } from '../utils/category/categoryDisplay';
import { getCategoryColor } from '../utils/category/categoryColors';

type MappingValue = string | { income: string; expense: string };

const resolveForType = (
  value: MappingValue,
  type: 'income' | 'expense',
  subcategories: Record<string, string>
): string => {
  const raw = typeof value === 'string' ? value : value[type];
  return subcategories[raw] || raw;
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
  <span
    className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
    style={{ backgroundColor: getCategoryColor(category) }}
  >
    {getCategoryDisplayName(category)}
  </span>
);

export const CategoryEditor: React.FC = () => {
  const categoryMapping = configLoader.getCategoryMapping();
  const subcategories = useMemo(
    () => categoryMapping.subcategories || {},
    [categoryMapping.subcategories]
  );

  const [mappings, setMappings] = useState<Record<string, MappingValue>>(
    () => ({ ...categoryMapping.mappings })
  );
  const [filterMode, setFilterMode] = useState<'others' | 'all'>('others');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const incomeCategories = useMemo(() => {
    const categories = categoryMapping.categories as { income?: string[]; expense?: string[] };
    return Array.isArray(categories.income) ? categories.income : [];
  }, [categoryMapping.categories]);

  const expenseCategories = useMemo(() => {
    const categories = categoryMapping.categories as { income?: string[]; expense?: string[] };
    return Array.isArray(categories.expense) ? categories.expense : [];
  }, [categoryMapping.categories]);

  const allIncomeOptions = useMemo(() => {
    const set = new Set(incomeCategories);
    Object.entries(subcategories).forEach(([key, val]) => {
      if (incomeCategories.includes(val)) set.add(key);
    });
    return [...set].sort();
  }, [incomeCategories, subcategories]);

  const allExpenseOptions = useMemo(() => {
    const set = new Set(expenseCategories);
    Object.entries(subcategories).forEach(([key, val]) => {
      if (expenseCategories.includes(val)) set.add(key);
    });
    return [...set].sort();
  }, [expenseCategories, subcategories]);

  const filteredEntries = useMemo(() => {
    let entries = Object.entries(mappings);

    if (filterMode === 'others') {
      entries = entries.filter(([, value]) => {
        const incResolved = resolveForType(value, 'income', subcategories);
        const expResolved = resolveForType(value, 'expense', subcategories);
        return (
          incResolved === 'other_income' ||
          incResolved === 'other_expense' ||
          expResolved === 'other_income' ||
          expResolved === 'other_expense'
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(([merchant]) =>
        merchant.toLowerCase().includes(q)
      );
    }

    return entries.sort(([a], [b]) => a.localeCompare(b));
  }, [mappings, filterMode, searchQuery, subcategories]);

  const handleChange = (
    merchant: string,
    type: 'income' | 'expense',
    newCategory: string
  ) => {
    setMappings(prev => {
      const current = prev[merchant];
      const incCurrent = typeof current === 'string' ? current : current.income;
      const expCurrent = typeof current === 'string' ? current : current.expense;

      const incNew = type === 'income' ? newCategory : incCurrent;
      const expNew = type === 'expense' ? newCategory : expCurrent;

      const newValue: MappingValue = incNew === expNew ? incNew : { income: incNew, expense: expNew };

      return { ...prev, [merchant]: newValue };
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    configLoader.saveCategoryMapping({
      ...categoryMapping,
      mappings,
    });
    setHasUnsavedChanges(false);
  };

  const handleDiscard = () => {
    setMappings({ ...categoryMapping.mappings });
    setHasUnsavedChanges(false);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-6 h-6" />
          <h2 className="text-2xl font-bold text-black">Category Mapping Editor</h2>
        </div>
        <p className="text-sm text-gray-600">
          Assign categories to merchant descriptions. Each merchant can have different categories for income and expense transactions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Filter toggle */}
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

        {/* Search */}
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

        {/* Count badge */}
        <span className="px-3 py-1 bg-gray-200 border-2 border-black rounded text-sm font-medium">
          {filteredEntries.length} items
        </span>

        {/* Save / Discard */}
        <div className="flex gap-2 ml-auto">
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
            className={`flex items-center gap-1 px-4 py-1.5 text-sm font-medium border-2 border-black rounded transition-all ${
              hasUnsavedChanges
                ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
                : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
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
              <th className="text-left px-3 py-2 border-b-2 border-black font-semibold w-56">Income Category</th>
              <th className="text-left px-3 py-2 border-b-2 border-black font-semibold w-56">Expense Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(([merchant, value]) => {
              const incRaw = typeof value === 'string' ? value : value.income;
              const expRaw = typeof value === 'string' ? value : value.expense;
              const incResolved = subcategories[incRaw] || incRaw;
              const expResolved = subcategories[expRaw] || expRaw;

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
                        {allIncomeOptions.map(cat => (
                          <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                        ))}
                        {/* If current value is not in income options, still show it */}
                        {!allIncomeOptions.includes(incRaw) && (
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
                        {allExpenseOptions.map(cat => (
                          <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                        ))}
                        {!allExpenseOptions.includes(expRaw) && (
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
