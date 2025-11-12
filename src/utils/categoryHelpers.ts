import { configLoader } from './configLoader';

// Category display names and colors - more distinct colors
const categoryDisplayInfo: Record<string, { name: string; color: string; type: 'income' | 'expense' }> = {
  // Income categories - Blue spectrum for clear distinction
  'salary': { name: 'Salary', color: '#3b82f6', type: 'income' },           // Blue-500
  'company_refund': { name: 'Company Refund', color: '#60a5fa', type: 'income' }, // Blue-400
  'country_refund': { name: 'Country/Tax Refund', color: '#2563eb', type: 'income' }, // Blue-600
  'withdraw': { name: 'Withdraw', color: '#93c5fd', type: 'income' },       // Blue-300
  'other_income': { name: 'Other Income', color: '#1d4ed8', type: 'income' }, // Blue-700

  // Expense categories - Red spectrum for clear distinction
  'invest': { name: 'Investment', color: '#ef4444', type: 'expense' },          // Red-500
  'education': { name: 'Education', color: '#f87171', type: 'expense' },        // Red-400
  'grocery': { name: 'Grocery', color: '#dc2626', type: 'expense' },            // Red-600
  'wear': { name: 'Clothing/Wear', color: '#fca5a5', type: 'expense' },         // Red-300
  'housing': { name: 'Housing', color: '#b91c1c', type: 'expense' },            // Red-700
  'utility': { name: 'Utility Cost', color: '#f97316', type: 'expense' },       // Orange-500 (reddish-orange)
  'medical': { name: 'Medical Expenses', color: '#e11d48', type: 'expense' },   // Rose-600
  'leisure': { name: 'Leisure', color: '#fb923c', type: 'expense' },            // Orange-400 (lighter reddish)
  'gift': { name: 'Gift', color: '#be123c', type: 'expense' },                  // Rose-700
  'insurance': { name: 'Insurance', color: '#fb7185', type: 'expense' },        // Rose-400
  'internal_transfer': { name: 'Internal Transfer', color: '#64748b', type: 'expense' }, // Slate-500 (neutral gray)
  'transit': { name: 'Transit', color: '#ea580c', type: 'expense' },            // Orange-600
  'tax': { name: 'Tax', color: '#991b1b', type: 'expense' },                    // Red-800
  'other_expense': { name: 'Other Expense', color: '#7f1d1d', type: 'expense' }, // Red-900

  // Legacy categories (for backward compatibility)
  'groceries': { name: 'Groceries', color: '#84cc16', type: 'expense' },
  'dining': { name: 'Dining', color: '#eab308', type: 'expense' },
  'transportation': { name: 'Transportation', color: '#0e7490', type: 'expense' },
  'shopping': { name: 'Shopping', color: '#ec4899', type: 'expense' },
  'healthcare': { name: 'Healthcare', color: '#9333ea', type: 'expense' },
  'entertainment': { name: 'Entertainment', color: '#f59e0b', type: 'expense' },
  'fitness': { name: 'Fitness', color: '#22c55e', type: 'expense' },
  'fees': { name: 'Fees', color: '#64748b', type: 'expense' },
  'travel': { name: 'Travel', color: '#0ea5e9', type: 'expense' },
  'communication': { name: 'Communication', color: '#14b8a6', type: 'expense' },
  'personal_care': { name: 'Personal Care', color: '#f97316', type: 'expense' },
  'pets': { name: 'Pets', color: '#fb923c', type: 'expense' },
  'investment': { name: 'Investment', color: '#f97316', type: 'expense' },
  'taxes': { name: 'Taxes', color: '#b91c1c', type: 'expense' },
  'pension': { name: 'Pension', color: '#991b1b', type: 'expense' },
  'other': { name: 'Other', color: '#64748b', type: 'expense' },
  'utilities': { name: 'Utilities', color: '#ea580c', type: 'expense' },
};

// Get the color for a category
export const getCategoryColor = (category: string): string => {
  // Normalize the category name
  const normalizedCategory = category.toLowerCase().trim();

  // First check our predefined display info
  const info = categoryDisplayInfo[normalizedCategory];
  if (info) return info.color;

  // Handle variations (invest vs investment) - both use same color now
  if (normalizedCategory === 'invest' || normalizedCategory === 'investment') {
    return '#ef4444'; // Red-500 (expense category)
  }

  // Check if this is an income category by checking known income category names
  const incomeCategories = ['salary', 'company_refund', 'country_refund', 'withdraw', 'other_income'];
  if (incomeCategories.some(cat => normalizedCategory.includes(cat))) {
    // Return a blue shade for any income category
    const blueShades = ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'];
    const index = incomeCategories.findIndex(cat => normalizedCategory.includes(cat));
    return blueShades[index] || blueShades[0];
  }

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
  const incomeCategories = ['salary', 'company_refund', 'country_refund', 'withdraw', 'other_income'];
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
    income: ['salary', 'company_refund', 'country_refund', 'withdraw', 'other_income'],
    expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'other_expense']
  };
};

// Export type for category names (for backward compatibility)
export type NewCategory = string;