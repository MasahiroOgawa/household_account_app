export interface CategoryDisplayInfo {
  name: string;
  color: string;
  type: 'income' | 'expense';
}

export interface CategoryMapping {
  mappings: Record<string, string | { income: string; expense: string }>;
  subcategories?: Record<string, string>;
  defaultCategory?: string | { income: string; expense: string };
  categories: {
    income?: string[] | Record<string, { name: string; color: string }>;
    expense?: string[] | Record<string, { name: string; color: string }>;
  } | Record<string, {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color: string;
  }>;
}
