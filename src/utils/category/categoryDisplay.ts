import { categoryDisplayInfo } from './categoryColors';
import { configLoader } from '../config/configLoader';

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

  const incomeCategories = ['salary', 'revenue', 'company_refund', 'country_refund', 'withdraw', 'other_income',
    'private-salary', 'private-revenue', 'private-company_refund', 'private-tax_refund', 'private-withdraw', 'private-other_income'];
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
    income: ['salary', 'revenue', 'company_refund', 'country_refund', 'withdraw', 'other_income'],
    expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'other_expense'],
  };
};
