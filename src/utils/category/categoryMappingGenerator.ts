import { Transaction } from '../../types/Transaction';

export interface CategoryMappingStructure {
  categories: {
    income: string[];
    expense: string[];
  };
  mappings: Record<string, string>;
}

const defaultCategories = {
  income: ['salary', 'company_refund', 'country_refund', 'withdraw', 'other_income'],
  expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'other_expense'],
};

const commonPatterns: Record<string, string> = {
  '給与': 'salary', '給料': 'salary', '賞与': 'salary', 'ボーナス': 'salary',
  '還付': 'country_refund', '返金': 'company_refund', '払戻': 'company_refund',
  '出金': 'withdraw', 'ATM': 'withdraw', '引出': 'withdraw', '現金': 'withdraw',
  'ＡＴＭ': 'withdraw', '引き出し': 'withdraw', '銀行振込': 'withdraw',
  'スーパー': 'grocery', 'イオン': 'grocery', 'セブンイレブン': 'grocery',
  'セブン-イレブン': 'grocery', 'ローソン': 'grocery', 'ファミリーマート': 'grocery',
  'ファミマ': 'grocery', '西友': 'grocery', 'まいばすけっと': 'grocery',
  'ライフ': 'grocery', 'コンビニ': 'grocery', 'サミット': 'grocery',
  'マルエツ': 'grocery',
  'ユニクロ': 'wear', 'UNIQLO': 'wear', 'ZARA': 'wear', 'GU': 'wear',
  '無印良品': 'wear', 'しまむら': 'wear', 'ワークマン': 'wear',
  '家賃': 'housing', '住宅': 'housing', '管理費': 'housing', '不動産': 'housing',
  'ニトリ': 'housing', 'IKEA': 'housing',
  '電気': 'utility', 'ガス': 'utility', '水道': 'utility', '電力': 'utility',
  '携帯': 'utility', 'ドコモ': 'utility', 'docomo': 'utility', 'au': 'utility',
  'ソフトバンク': 'utility', 'NTT': 'utility', '通信': 'utility',
  '病院': 'medical', '薬局': 'medical', 'クリニック': 'medical', '歯科': 'medical',
  'マツモトキヨシ': 'medical', 'ウエルシア': 'medical',
  '学校': 'education', '塾': 'education', '書籍': 'education', '教育': 'education',
  'Netflix': 'leisure', 'Spotify': 'leisure', 'YouTube': 'leisure',
  '映画': 'leisure', 'カラオケ': 'leisure', '旅行': 'leisure',
  'ホテル': 'leisure', 'レストラン': 'leisure', 'カフェ': 'leisure',
  'スターバックス': 'leisure', 'マクドナルド': 'leisure', '外食': 'leisure',
  '証券': 'invest', '株式': 'invest', 'SBI': 'invest', '投資': 'invest',
  'ギフト': 'gift', 'プレゼント': 'gift', 'お祝い': 'gift',
  'Amazon': 'other_expense', 'AMAZON': 'other_expense',
};

const detectPatternCategory = (description: string, transactionType: 'income' | 'expense'): string => {
  const lowerDesc = description.toLowerCase();
  const sortedPatterns = Object.entries(commonPatterns).sort((a, b) => b[0].length - a[0].length);

  for (const [pattern, category] of sortedPatterns) {
    if (lowerDesc.includes(pattern.toLowerCase())) {
      return category;
    }
  }

  if (transactionType === 'income') {
    if (lowerDesc.includes('給') || lowerDesc.includes('salary')) return 'salary';
    if (lowerDesc.includes('還付') || lowerDesc.includes('refund')) return 'country_refund';
    if (lowerDesc.includes('返金')) return 'company_refund';
    if (lowerDesc.includes('atm') || lowerDesc.includes('出金') || lowerDesc.includes('振込')) return 'withdraw';
    return 'other_income';
  }

  return 'other_expense';
};

export const analyzeTransactionsForMapping = (transactions: Transaction[]): CategoryMappingStructure => {
  const allDescriptions = new Map<string, { count: number; type: 'income' | 'expense'; suggestedCategory: string }>();

  transactions.forEach((transaction) => {
    const shopName = transaction.shopName;
    const description = transaction.description;
    let keyToUse = shopName && shopName !== 'Unknown' ? shopName : description;
    if (!keyToUse || keyToUse.trim() === '') keyToUse = description;
    if (!keyToUse || keyToUse.trim() === '') return;

    const key = keyToUse.trim();
    const existing = allDescriptions.get(key);
    if (existing) {
      existing.count++;
    } else {
      const suggestedCategory = detectPatternCategory(key, transaction.type as 'income' | 'expense');
      allDescriptions.set(key, {
        count: 1,
        type: transaction.type as 'income' | 'expense',
        suggestedCategory,
      });
    }
  });

  const mappings: Record<string, string> = {};
  const sortedDescriptions = Array.from(allDescriptions.keys()).sort((a, b) =>
    a.localeCompare(b, 'ja', { sensitivity: 'base' })
  );

  sortedDescriptions.forEach(description => {
    const info = allDescriptions.get(description)!;
    mappings[description] = info.suggestedCategory;
  });

  return { categories: defaultCategories, mappings };
};

export const exportCategoryMapping = (transactions: Transaction[]): string => {
  const mapping = analyzeTransactionsForMapping(transactions);
  return JSON.stringify(mapping, null, 2);
};
