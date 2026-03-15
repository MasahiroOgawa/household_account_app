import { categoryDisplayInfo } from './categoryColors';
import { configLoader } from '../config/configLoader';

// Build reverse lookup: display name (lowered) -> internal key
const displayNameToKey: Record<string, string> = Object.fromEntries(
  Object.entries(categoryDisplayInfo).map(([key, info]) => [info.name.toLowerCase(), key])
);

/**
 * Check if a category is a valid subcategory key (Japanese 勘定科目 or private-* prefixed).
 * Plain English main categories (e.g. "education") are NOT valid subcategory keys.
 */
const isValidSubcategoryKey = (category: string): boolean => {
  if (category.startsWith('private-')) return true;
  const mapping = configLoader.getCategoryMapping();
  const subcategories = mapping.subcategories;
  if (!subcategories) return false;
  const isSplit = 'income' in subcategories || 'expense' in subcategories;
  if (isSplit) {
    const split = subcategories as Record<string, Record<string, string>>;
    return !!(split.income?.[category] || split.expense?.[category]);
  }
  return category in (subcategories as Record<string, string>);
};

/**
 * Normalize any category string to canonical subcategory key.
 * Plain English main categories are auto-prefixed with "private-".
 */
export const normalizeCategory = (category: string): string => {
  if (!category) return category;
  const trimmed = category.trim();

  // Handle private-* prefix: normalize the base part, keep prefix
  if (trimmed.startsWith('private-')) {
    const base = trimmed.slice(8).trim().toLowerCase().replace(/\s+/g, '_');
    return `private-${base}`;
  }

  // Already a valid subcategory key (Japanese 勘定科目)
  if (isValidSubcategoryKey(trimmed)) return trimmed;

  // Resolve to a known internal key
  let resolved = trimmed;
  if (categoryDisplayInfo[trimmed]) {
    resolved = trimmed;
  } else if (categoryDisplayInfo[trimmed.toLowerCase()]) {
    resolved = trimmed.toLowerCase();
  } else {
    const reversed = displayNameToKey[trimmed.toLowerCase()];
    if (reversed) resolved = reversed;
    else resolved = trimmed.toLowerCase().replace(/\s+/g, '_');
  }

  // If resolved is a plain English main category, prefix with private-
  if (resolved && !isValidSubcategoryKey(resolved)) {
    return `private-${resolved}`;
  }
  return resolved;
};

export const getCategoryDisplayName = (category: string): string => {
  const info = categoryDisplayInfo[category.toLowerCase()];
  if (info) return info.name;

  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  if ('income' in categories && 'expense' in categories) {
    const incomeCategory = (categories.income as any)[category];
    if (incomeCategory && typeof incomeCategory === 'object' && incomeCategory.name) {
      return incomeCategory.name;
    }
    const expenseCategory = (categories.expense as any)[category];
    if (expenseCategory && typeof expenseCategory === 'object' && expenseCategory.name) {
      return expenseCategory.name;
    }
  } else {
    const categoryInfo = (categories as any)[category];
    if (categoryInfo && categoryInfo.name) return categoryInfo.name;
  }

  // Handle private-* prefix: strip it and look up the parent
  if (category.startsWith('private-')) {
    const parent = category.slice(8);
    const parentInfo = categoryDisplayInfo[parent.toLowerCase()];
    if (parentInfo) return parentInfo.name;
    return parent.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return category.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const getCategoryType = (category: string): 'income' | 'expense' | 'transfer' => {
  const info = categoryDisplayInfo[category.toLowerCase()];
  if (info) return info.type;

  const incomeCategories = ['salary', 'revenue', 'company_refund', 'country_refund', 'deposit', 'other_income',
    'private-salary', 'private-revenue', 'private-company_refund', 'private-tax_refund', 'private-deposit', 'private-other_income'];
  if (incomeCategories.includes(category.toLowerCase())) return 'income';

  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  if ('income' in categories && 'expense' in categories) {
    const income = categories.income;
    const expense = categories.expense;
    if (Array.isArray(income) && income.includes(category)) return 'income';
    if (Array.isArray(expense) && expense.includes(category)) return 'expense';
    if (income && typeof income === 'object' && category in income) return 'income';
    if (expense && typeof expense === 'object' && category in expense) return 'expense';
  } else {
    const categoryInfo = (categories as any)[category];
    if (categoryInfo?.type) return categoryInfo.type;
  }

  return 'expense';
};

export const getAllCategories = (): { income: string[]; expense: string[] } => {
  return {
    income: ['salary', 'revenue', 'company_refund', 'country_refund', 'deposit', 'other_income'],
    expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'withdraw', 'other_expense'],
  };
};
