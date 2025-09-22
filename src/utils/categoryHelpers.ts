import { configLoader } from './configLoader';

// Get the color for a category
export const getCategoryColor = (category: string): string => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the new structure with income/expense separation
  if ('income' in categories && 'expense' in categories) {
    const incomeCategory = (categories.income as any)[category];
    if (incomeCategory && typeof incomeCategory === 'object') return incomeCategory.color;

    const expenseCategory = (categories.expense as any)[category];
    if (expenseCategory && typeof expenseCategory === 'object') return expenseCategory.color;
  } else {
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo) return categoryInfo.color;
  }

  return '#94a3b8'; // Default gray color
};

// Get the display name for a category
export const getCategoryDisplayName = (category: string): string => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the new structure with income/expense separation
  if ('income' in categories && 'expense' in categories) {
    const incomeCategory = (categories.income as any)[category];
    if (incomeCategory && typeof incomeCategory === 'object') return incomeCategory.name;

    const expenseCategory = (categories.expense as any)[category];
    if (expenseCategory && typeof expenseCategory === 'object') return expenseCategory.name;
  } else {
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo) return categoryInfo.name;
  }

  return category;
};

// Get category type (income/expense/transfer)
export const getCategoryType = (category: string): 'income' | 'expense' | 'transfer' => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the new structure with income/expense separation
  if ('income' in categories && 'expense' in categories) {
    if (category in categories.income) return 'income';
    if (category in categories.expense) return 'expense';
  } else {
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo?.type) return categoryInfo.type;
  }

  return 'expense'; // Default to expense
};

// Export type for category names (for backward compatibility)
export type NewCategory = string;