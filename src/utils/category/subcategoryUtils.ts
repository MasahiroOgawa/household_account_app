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
  if (subcategories) {
    const isSplit = 'income' in subcategories || 'expense' in subcategories;
    if (isSplit) {
      // Split format: { income: {...}, expense: {...} }
      // Check given type first, then the other (subcategory may exist in either)
      const split = subcategories as Record<string, Record<string, string>>;
      const otherType = type === 'income' ? 'expense' : 'income';
      for (const t of [type, otherType]) {
        if (split[t]?.[subcategory]) return split[t][subcategory];
      }
    } else {
      // Flat format: { "旅費交通費": "transit", ... }
      const flat = subcategories as Record<string, string>;
      if (typeof flat[subcategory] === 'string') return flat[subcategory];
    }
  }
  // If it's a private-* key, strip prefix and return as-is (it IS the english category)
  if (subcategory.startsWith('private-')) return subcategory.slice(8);
  return subcategory;
};

export const isBusinessCategory = (category: string): boolean => !category.startsWith('private-');
