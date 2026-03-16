import { Transaction } from '../types/Transaction';
import { configLoader } from './config/configLoader';

// Official 勘定科目 order for 青色申告決算書
const KAMOKU_ORDER = [
  '売上原価', '租税公課', '荷造運賃', '水道光熱費', '旅費交通費',
  '通信費', '広告宣伝費', '接待交際費', '損害保険料', '修繕費',
  '消耗品費', '減価償却費', '福利厚生費', '給料賃金', '外注費',
  '利子割引料', '地代家賃', '貸倒金', '寄附金', '新聞図書費',
  '支払手数料', '修繕積立金', '保険料', '雑費', '人件費',
  '未償却の繰延資産', '専従者給与', '貸倒損失',
];

export interface BlueReturnData {
  year: number;
  revenue: number;
  kamokuTotals: Record<string, number>;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
  jigyounushiKashi: number; // 事業主貸 (private expenses paid from business)
  jigyounushiKari: number;  // 事業主借 (private income into business)
  totalExpenses: number;
}

const getJapaneseKamokuKeys = (): { income: Set<string>; expense: Set<string> } => {
  const mapping = configLoader.getCategoryMapping();
  const subcategories = mapping.subcategories;
  const income = new Set<string>();
  const expense = new Set<string>();
  if (!subcategories) return { income, expense };

  const isSplit = 'income' in subcategories || 'expense' in subcategories;
  if (isSplit) {
    const split = subcategories as Record<string, Record<string, string>>;
    for (const key of Object.keys(split.income || {})) {
      if (!key.startsWith('private-')) income.add(key);
    }
    for (const key of Object.keys(split.expense || {})) {
      if (!key.startsWith('private-')) expense.add(key);
    }
  }
  return { income, expense };
};

export const isBusinessTransaction = (t: Transaction): boolean => {
  const keys = getJapaneseKamokuKeys();
  return (t.type === 'income' && keys.income.has(t.category))
    || (t.type === 'expense' && keys.expense.has(t.category));
};

export const calculateBlueReturn = (transactions: Transaction[], year: number, businessSources?: string[]): BlueReturnData => {
  const keys = getJapaneseKamokuKeys();
  const yearTxns = transactions.filter(t => t.date.startsWith(String(year)));
  const bizSourceSet = businessSources && businessSources.length > 0 ? new Set(businessSources) : null;

  let revenue = 0;
  let jigyounushiKashi = 0;
  let jigyounushiKari = 0;
  const kamokuTotals: Record<string, number> = {};
  const monthlyRevenue = Array(12).fill(0) as number[];
  const monthlyExpenses = Array(12).fill(0) as number[];

  for (const t of yearTxns) {
    const month = new Date(t.date).getMonth(); // 0-based
    const amt = Math.abs(t.amount);

    if (t.type === 'income' && keys.income.has(t.category)) {
      // Business income: counted regardless of source bank
      revenue += amt;
      monthlyRevenue[month] += amt;
    } else if (t.type === 'expense' && keys.expense.has(t.category)) {
      // Business expense: counted regardless of source bank
      kamokuTotals[t.category] = (kamokuTotals[t.category] || 0) + amt;
      monthlyExpenses[month] += amt;
    } else if (bizSourceSet && !bizSourceSet.has(t.source)) {
      // Private transaction from a non-business bank → ignore entirely
      continue;
    } else if (t.type === 'expense') {
      // Private expense through business account → 事業主貸
      jigyounushiKashi += amt;
    } else {
      // Private income through business account → 事業主借
      jigyounushiKari += amt;
    }
  }

  const totalExpenses = Object.values(kamokuTotals).reduce((s, v) => s + v, 0);

  return { year, revenue, kamokuTotals, monthlyRevenue, monthlyExpenses, jigyounushiKashi, jigyounushiKari, totalExpenses };
};

export const getSortedKamoku = (kamokuTotals: Record<string, number>): [string, number][] => {
  const entries = Object.entries(kamokuTotals);
  entries.sort((a, b) => {
    const ia = KAMOKU_ORDER.indexOf(a[0]);
    const ib = KAMOKU_ORDER.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return entries;
};

export const getAvailableYears = (transactions: Transaction[]): number[] => {
  const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
  return [...years].sort((a, b) => b - a);
};

export const getAvailableSources = (transactions: Transaction[]): string[] => {
  const sources = new Set(transactions.map(t => t.source));
  return [...sources].sort();
};
