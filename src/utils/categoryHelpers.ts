import { configLoader } from './configLoader';

// Category display names and colors
const categoryDisplayInfo: Record<string, { name: string; color: string; type: 'income' | 'expense' }> = {
  // Income categories
  'salary': { name: 'Salary', color: '#10b981', type: 'income' },
  'company_refund': { name: 'Company Refund', color: '#14b8a6', type: 'income' },
  'country_refund': { name: 'Country/Tax Refund', color: '#0891b2', type: 'income' },
  'withdraw': { name: 'Withdraw', color: '#06b6d4', type: 'income' },
  'others_income': { name: 'Other Income', color: '#22c55e', type: 'income' },

  // Expense categories
  'invest': { name: 'Investment', color: '#3b82f6', type: 'expense' },
  'education': { name: 'Education', color: '#2563eb', type: 'expense' },
  'grocery': { name: 'Grocery', color: '#84cc16', type: 'expense' },
  'wear': { name: 'Clothing/Wear', color: '#ec4899', type: 'expense' },
  'housing': { name: 'Housing', color: '#ef4444', type: 'expense' },
  'utility': { name: 'Utility Cost', color: '#f59e0b', type: 'expense' },
  'medical': { name: 'Medical Expenses', color: '#8b5cf6', type: 'expense' },
  'leisure': { name: 'Leisure', color: '#a855f7', type: 'expense' },
  'gift': { name: 'Gift', color: '#f97316', type: 'expense' },
  'others': { name: 'Others', color: '#94a3b8', type: 'expense' },

  // Legacy categories (for backward compatibility)
  'groceries': { name: 'Groceries', color: '#84cc16', type: 'expense' },
  'dining': { name: 'Dining', color: '#eab308', type: 'expense' },
  'transportation': { name: 'Transportation', color: '#06b6d4', type: 'expense' },
  'shopping': { name: 'Shopping', color: '#ec4899', type: 'expense' },
  'healthcare': { name: 'Healthcare', color: '#8b5cf6', type: 'expense' },
  'insurance': { name: 'Insurance', color: '#6366f1', type: 'expense' },
  'entertainment': { name: 'Entertainment', color: '#a855f7', type: 'expense' },
  'fitness': { name: 'Fitness', color: '#22c55e', type: 'expense' },
  'fees': { name: 'Fees', color: '#64748b', type: 'expense' },
  'travel': { name: 'Travel', color: '#0ea5e9', type: 'expense' },
  'communication': { name: 'Communication', color: '#14b8a6', type: 'expense' },
  'personal_care': { name: 'Personal Care', color: '#f97316', type: 'expense' },
  'pets': { name: 'Pets', color: '#fb923c', type: 'expense' },
  'investment': { name: 'Investment', color: '#3b82f6', type: 'expense' },
  'taxes': { name: 'Taxes', color: '#dc2626', type: 'expense' },
  'pension': { name: 'Pension', color: '#991b1b', type: 'expense' },
  'other': { name: 'Other', color: '#94a3b8', type: 'expense' },
  'utilities': { name: 'Utilities', color: '#f59e0b', type: 'expense' },
};

// Get the color for a category
export const getCategoryColor = (category: string): string => {
  // First check our predefined display info
  const info = categoryDisplayInfo[category.toLowerCase()];
  if (info) return info.color;

  // Try to get from config (for backward compatibility)
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the old structure format
  if ('income' in categories && 'expense' in categories) {
    const incomeCategory = (categories.income as any)[category];
    if (incomeCategory && typeof incomeCategory === 'object' && incomeCategory.color) {
      return incomeCategory.color;
    }

    const expenseCategory = (categories.expense as any)[category];
    if (expenseCategory && typeof expenseCategory === 'object' && expenseCategory.color) {
      return expenseCategory.color;
    }
  } else {
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo && categoryInfo.color) return categoryInfo.color;
  }

  return '#94a3b8'; // Default gray color
};

// Get the display name for a category
export const getCategoryDisplayName = (category: string): string => {
  // First check our predefined display info
  const info = categoryDisplayInfo[category.toLowerCase()];
  if (info) return info.name;

  // Try to get from config (for backward compatibility)
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the old structure format
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
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo && categoryInfo.name) return categoryInfo.name;
  }

  // Format category name if no display name found
  return category.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Get category type (income/expense/transfer)
export const getCategoryType = (category: string): 'income' | 'expense' | 'transfer' => {
  // First check our predefined display info
  const info = categoryDisplayInfo[category.toLowerCase()];
  if (info) return info.type;

  // Check if it's an income category
  const incomeCategories = ['salary', 'company_refund', 'country_refund', 'withdraw', 'others_income'];
  if (incomeCategories.includes(category.toLowerCase())) return 'income';

  // Try to get from config (for backward compatibility)
  const categoryConfig = configLoader.getCategoryMapping();
  const categories = categoryConfig.categories;

  // Check if it's the new structure format
  if ('income' in categories && 'expense' in categories) {
    const income = categories.income;
    const expense = categories.expense;

    if (Array.isArray(income) && income.includes(category)) return 'income';
    if (Array.isArray(expense) && expense.includes(category)) return 'expense';

    if (income && typeof income === 'object' && category in income) return 'income';
    if (expense && typeof expense === 'object' && category in expense) return 'expense';
  } else {
    // Old structure
    const categoryInfo = (categories as any)[category];
    if (categoryInfo?.type) return categoryInfo.type;
  }

  return 'expense'; // Default to expense
};

// Get all categories
export const getAllCategories = (): { income: string[]; expense: string[] } => {
  return {
    income: ['salary', 'company_refund', 'country_refund', 'withdraw', 'others_income'],
    expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'others']
  };
};

// Export type for category names (for backward compatibility)
export type NewCategory = string;