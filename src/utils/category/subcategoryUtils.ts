import { configLoader } from '../config/configLoader';

export const getSubcategoryOptions = (type: 'income' | 'expense'): string[] => {
  const mapping = configLoader.getCategoryMapping();
  const subcategories = mapping.subcategories;
  if (!subcategories || !(type in subcategories)) return [];
  const subcatMap = (subcategories as Record<string, Record<string, string>>)[type];
  return Object.keys(subcatMap);
};

export const resolveToEnglishCategory = (subcategory: string, type: 'income' | 'expense'): string => {
  const mapping = configLoader.getCategoryMapping();
  const subcategories = mapping.subcategories;
  if (subcategories && type in subcategories) {
    const subcatMap = (subcategories as Record<string, Record<string, string>>)[type];
    if (subcatMap[subcategory]) return subcatMap[subcategory];
  }
  // If it's a private-* key, strip prefix and return as-is (it IS the english category)
  if (subcategory.startsWith('private-')) return subcategory.slice(8);
  return subcategory;
};

export const isBusinessCategory = (category: string): boolean => !category.startsWith('private-');
