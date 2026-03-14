import { CategoryDisplayInfo } from '../../types/Category';

export const categoryDisplayInfo: Record<string, CategoryDisplayInfo> = {
  // Income categories - Blue spectrum
  'salary': { name: 'Salary', color: '#3b82f6', type: 'income' },
  'company_refund': { name: 'Company Refund', color: '#60a5fa', type: 'income' },
  'country_refund': { name: 'Country/Tax Refund', color: '#2563eb', type: 'income' },
  'deposit': { name: 'Deposit', color: '#93c5fd', type: 'income' },
  'revenue': { name: 'Revenue', color: '#0ea5e9', type: 'income' },
  'other_income': { name: 'Other Income', color: '#1d4ed8', type: 'income' },

  // Japanese income
  '給与': { name: '給与', color: '#3b82f6', type: 'income' },
  '賞与': { name: '賞与', color: '#60a5fa', type: 'income' },
  '投資収益': { name: '投資収益', color: '#2563eb', type: 'income' },
  '利息': { name: '利息', color: '#93c5fd', type: 'income' },
  '配当': { name: '配当', color: '#1d4ed8', type: 'income' },
  '還付金': { name: '還付金', color: '#60a5fa', type: 'income' },
  '返金': { name: '返金', color: '#2563eb', type: 'income' },
  '現金引出': { name: '現金引出', color: '#93c5fd', type: 'income' },
  'その他収入': { name: 'その他収入', color: '#1d4ed8', type: 'income' },

  // Expense categories - Red spectrum
  'invest': { name: 'Investment', color: '#ef4444', type: 'expense' },
  'education': { name: 'Education', color: '#f87171', type: 'expense' },
  'grocery': { name: 'Grocery', color: '#dc2626', type: 'expense' },
  'wear': { name: 'Wear', color: '#fca5a5', type: 'expense' },
  'housing': { name: 'Housing', color: '#b91c1c', type: 'expense' },
  'utility': { name: 'Utility Cost', color: '#f97316', type: 'expense' },
  'medical': { name: 'Medical Expenses', color: '#e11d48', type: 'expense' },
  'leisure': { name: 'Leisure', color: '#fb923c', type: 'expense' },
  'gift': { name: 'Gift', color: '#be123c', type: 'expense' },
  'insurance': { name: 'Insurance', color: '#fb7185', type: 'expense' },
  'fee': { name: 'Fee', color: '#fdba74', type: 'expense' },
  'withdraw': { name: 'Withdraw', color: '#a3a3a3', type: 'expense' },
  'yuka': { name: 'Yuka', color: '#f0abfc', type: 'expense' },
  'beauty': { name: 'Beauty', color: '#e879f9', type: 'expense' },
  'internal_transfer': { name: 'Internal Transfer', color: '#64748b', type: 'expense' },
  'transit': { name: 'Transit', color: '#ea580c', type: 'expense' },
  'tax': { name: 'Tax', color: '#991b1b', type: 'expense' },
  'credit_card_payment': { name: 'Credit Card Payment', color: '#a855f7', type: 'expense' },
  'other_expense': { name: 'Other Expense', color: '#7f1d1d', type: 'expense' },

  // Japanese expense
  '食費': { name: '食費', color: '#ef4444', type: 'expense' },
  '外食': { name: '外食', color: '#f87171', type: 'expense' },
  '交通費': { name: '交通費', color: '#ea580c', type: 'expense' },
  'ショッピング': { name: 'ショッピング', color: '#fbbf24', type: 'expense' },
  '光熱費': { name: '光熱費', color: '#a78bfa', type: 'expense' },
  '通信費': { name: '通信費', color: '#c084fc', type: 'expense' },
  '住居費': { name: '住居費', color: '#e879f9', type: 'expense' },
  '医療費': { name: '医療費', color: '#ec4899', type: 'expense' },
  '保険': { name: '保険', color: '#f472b6', type: 'expense' },
  '教育費': { name: '教育費', color: '#818cf8', type: 'expense' },
  '趣味・娯楽': { name: '趣味・娯楽', color: '#60a5fa', type: 'expense' },
  '美容・理容': { name: '美容・理容', color: '#93c5fd', type: 'expense' },
  '衣服': { name: '衣服', color: '#ddd6fe', type: 'expense' },
  '日用品': { name: '日用品', color: '#fde68a', type: 'expense' },
  'ペット': { name: 'ペット', color: '#fed7aa', type: 'expense' },
  '税金': { name: '税金', color: '#991b1b', type: 'expense' },
  '手数料': { name: '手数料', color: '#fdba74', type: 'expense' },
  '振込・振替': { name: '振込・振替', color: '#cbd5e1', type: 'expense' },
  '振込': { name: '振込', color: '#cbd5e1', type: 'expense' },
  '現金': { name: '現金', color: '#e2e8f0', type: 'expense' },
  'その他支出': { name: 'その他支出', color: '#7f1d1d', type: 'expense' },

  // Legacy
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

const incomeColorMap: Record<string, string> = {
  'salary': '#3b82f6',
  'revenue': '#0ea5e9',
  'company_refund': '#60a5fa',
  'country_refund': '#2563eb',
  'deposit': '#93c5fd',
  'other_income': '#1d4ed8',
  'bonus': '#0ea5e9',
  'investment': '#06b6d4',
  'interest': '#14b8a6',
  'dividend': '#0d9488',
  '給与': '#3b82f6',
  '賞与': '#0ea5e9',
  '投資収益': '#06b6d4',
  '利息': '#14b8a6',
  '配当': '#0d9488',
  '還付金': '#60a5fa',
  '返金': '#2563eb',
  '現金引出': '#93c5fd',
  'その他収入': '#1d4ed8',
};

const blueShades = [
  '#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8',
  '#0ea5e9', '#06b6d4', '#14b8a6',
];

export const getCategoryColor = (category: string): string => {
  const normalized = category.toLowerCase().trim();
  const info = categoryDisplayInfo[normalized];
  if (info) return info.color;

  // Handle private-* categories by stripping prefix
  if (normalized.startsWith('private-')) {
    const parent = categoryDisplayInfo[normalized.slice(8)];
    if (parent) return parent.color;
  }

  if (normalized === 'invest' || normalized === 'investment') {
    return '#ef4444';
  }

  return '#94a3b8';
};

export const getIncomeCategoryColor = (category: string, index: number = 0): string => {
  const normalized = category.toLowerCase().trim();
  if (incomeColorMap[normalized]) {
    return incomeColorMap[normalized];
  }
  return blueShades[index % blueShades.length];
};

export const DEFAULT_COLOR = '#94a3b8';
