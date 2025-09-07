import { configLoader } from './configLoader';

// Get the color for a category
export const getCategoryColor = (category: string): string => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categoryInfo = categoryConfig.categories[category];
  return categoryInfo?.color || '#94a3b8'; // Default gray color
};

// Get the display name for a category
export const getCategoryDisplayName = (category: string): string => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categoryInfo = categoryConfig.categories[category];
  return categoryInfo?.name || category;
};

// Get category type (income/expense/transfer)
export const getCategoryType = (category: string): 'income' | 'expense' | 'transfer' => {
  const categoryConfig = configLoader.getCategoryMapping();
  const categoryInfo = categoryConfig.categories[category];
  return (categoryInfo?.type || 'expense') as 'income' | 'expense' | 'transfer';
};

// Export type for category names (for backward compatibility)
export type NewCategory = string;