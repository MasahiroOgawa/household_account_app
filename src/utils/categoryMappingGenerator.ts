import { Transaction } from '../types/Transaction';

export interface CategoryMappingStructure {
  categories: {
    income: {
      [key: string]: {
        name: string;
        color: string;
      };
    };
    expense: {
      [key: string]: {
        name: string;
        color: string;
      };
    };
  };
  mappings: {
    [description: string]: string;
  };
  defaultCategory: {
    income: string;
    expense: string;
  };
}

// Define categories as per user requirements
const defaultCategories = {
  income: {
    salary: { name: 'Salary', color: '#10b981' },
    company_refund: { name: 'Company Refund', color: '#14b8a6' },
    country_refund: { name: 'Country/Tax Refund', color: '#0891b2' },
    withdraw: { name: 'Withdraw', color: '#06b6d4' },
    others_income: { name: 'Other Income', color: '#22c55e' }
  },
  expense: {
    invest: { name: 'Investment', color: '#3b82f6' },
    education: { name: 'Education', color: '#2563eb' },
    grocery: { name: 'Grocery', color: '#84cc16' },
    wear: { name: 'Clothing/Wear', color: '#ec4899' },
    housing: { name: 'Housing', color: '#ef4444' },
    utility: { name: 'Utility Cost', color: '#f59e0b' },
    medical: { name: 'Medical Expenses', color: '#8b5cf6' },
    leisure: { name: 'Leisure/Entertainment', color: '#a855f7' },
    gift: { name: 'Gift', color: '#f97316' },
    others: { name: 'Others', color: '#94a3b8' }
  }
};

// Common patterns for initial categorization
const commonPatterns: { [pattern: string]: string } = {
  // Income patterns
  '給与': 'salary',
  '給料': 'salary',
  '賞与': 'salary',
  'ボーナス': 'salary',
  '還付': 'country_refund',
  '返金': 'company_refund',
  '払戻': 'company_refund',
  '出金': 'withdraw',
  'ATM': 'withdraw',
  '引出': 'withdraw',

  // Grocery patterns
  'スーパー': 'grocery',
  'イオン': 'grocery',
  'セブンイレブン': 'grocery',
  'セブン-イレブン': 'grocery',
  'ローソン': 'grocery',
  'ファミリーマート': 'grocery',
  'ファミマ': 'grocery',
  '西友': 'grocery',
  'イトーヨーカドー': 'grocery',
  '成城石井': 'grocery',
  'まいばすけっと': 'grocery',
  'ライフ': 'grocery',
  'アトレ': 'grocery',

  // Wear/Clothing patterns
  'ユニクロ': 'wear',
  'UNIQLO': 'wear',
  'ZARA': 'wear',
  'GU': 'wear',
  '無印良品': 'wear',
  'しまむら': 'wear',

  // Housing patterns
  '家賃': 'housing',
  '住宅': 'housing',
  '管理費': 'housing',
  '修繕': 'housing',
  '不動産': 'housing',

  // Utility patterns
  '電気': 'utility',
  'ガス': 'utility',
  '水道': 'utility',
  '電力': 'utility',
  '東京電力': 'utility',
  '東京ガス': 'utility',
  '携帯': 'utility',
  'ドコモ': 'utility',
  'au': 'utility',
  'ソフトバンク': 'utility',
  'インターネット': 'utility',

  // Medical patterns
  '病院': 'medical',
  '薬局': 'medical',
  'クリニック': 'medical',
  '歯科': 'medical',
  '医療': 'medical',
  'マツモトキヨシ': 'medical',
  'ウエルシア': 'medical',

  // Education patterns
  '学校': 'education',
  '塾': 'education',
  '習い事': 'education',
  '予備校': 'education',
  '大学': 'education',
  '書籍': 'education',
  '本屋': 'education',

  // Leisure patterns
  'Netflix': 'leisure',
  'Spotify': 'leisure',
  'ディズニー': 'leisure',
  '映画': 'leisure',
  'カラオケ': 'leisure',
  '旅行': 'leisure',
  'ホテル': 'leisure',
  'レストラン': 'leisure',
  'カフェ': 'leisure',

  // Investment patterns
  '証券': 'invest',
  '株式': 'invest',
  'SBI': 'invest',
  '投資': 'invest',
  '積立': 'invest',

  // Gift patterns
  'ギフト': 'gift',
  'プレゼント': 'gift',
  '贈': 'gift',
  'お祝い': 'gift',
};

// Analyze transactions to generate mappings with ALL descriptions
export const analyzeTransactionsForMapping = (transactions: Transaction[]): CategoryMappingStructure => {
  const allDescriptions = new Map<string, { count: number; type: 'income' | 'expense'; suggestedCategory: string }>();

  // Collect ALL unique descriptions from transactions
  transactions.forEach(transaction => {
    const description = transaction.description?.trim();
    if (!description) return;

    // Store the description with its frequency and type
    const existing = allDescriptions.get(description);
    if (existing) {
      existing.count++;
    } else {
      // Try to determine category based on patterns
      let suggestedCategory = '';
      const lowerDesc = description.toLowerCase();

      // Check for pattern matches
      for (const [pattern, category] of Object.entries(commonPatterns)) {
        if (lowerDesc.includes(pattern.toLowerCase())) {
          suggestedCategory = category;
          break;
        }
      }

      // If no pattern matched, assign default category
      if (!suggestedCategory) {
        if (transaction.type === 'income') {
          // Check for specific income patterns
          if (lowerDesc.includes('給') || lowerDesc.includes('賞与')) {
            suggestedCategory = 'salary';
          } else if (lowerDesc.includes('還付') || lowerDesc.includes('税')) {
            suggestedCategory = 'country_refund';
          } else if (lowerDesc.includes('返金') || lowerDesc.includes('払戻')) {
            suggestedCategory = 'company_refund';
          } else if (lowerDesc.includes('atm') || lowerDesc.includes('出金') || lowerDesc.includes('引出')) {
            suggestedCategory = 'withdraw';
          } else {
            suggestedCategory = 'others_income';
          }
        } else {
          // For expenses, try to be more specific
          if (lowerDesc.includes('アトレ')) {
            suggestedCategory = 'grocery';
          } else {
            suggestedCategory = 'others';
          }
        }
      }

      allDescriptions.set(description, {
        count: 1,
        type: transaction.type as 'income' | 'expense',
        suggestedCategory: suggestedCategory
      });
    }
  });

  // Build mappings object with ALL descriptions, sorted alphabetically
  const mappings: { [description: string]: string } = {};
  const sortedDescriptions = Array.from(allDescriptions.keys()).sort((a, b) =>
    a.localeCompare(b, 'ja', { sensitivity: 'base' })
  );

  sortedDescriptions.forEach(description => {
    const info = allDescriptions.get(description)!;
    mappings[description] = info.suggestedCategory;
  });

  // Add specific mapping for アトレオオイマチ as requested
  if (!mappings['アトレオオイマチ']) {
    mappings['アトレオオイマチ'] = 'grocery';
  }

  // Sort mappings alphabetically (Japanese and English)
  const sortedMappings: { [description: string]: string } = {};
  Object.keys(mappings)
    .sort((a, b) => a.localeCompare(b, 'ja', { sensitivity: 'base' }))
    .forEach(key => {
      sortedMappings[key] = mappings[key];
    });

  return {
    categories: defaultCategories,
    mappings: sortedMappings,
    defaultCategory: {
      income: 'others_income',
      expense: 'others'
    }
  };
};

// Generate and download category mapping file
export const generateCategoryMappingFile = (transactions: Transaction[]): void => {
  const mapping = analyzeTransactionsForMapping(transactions);

  // Convert to JSON with proper formatting
  const jsonContent = JSON.stringify(mapping, null, 2);

  // Create blob and download using native browser API
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'categoryMapping_generated.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Generated category mapping with:', {
    categoriesCount: Object.keys(mapping.categories.income).length + Object.keys(mapping.categories.expense).length,
    mappingsCount: Object.keys(mapping.mappings).length,
    descriptions: `All ${Object.keys(mapping.mappings).length} unique descriptions mapped`
  });
};

// Export mapping for manual download
export const exportCategoryMapping = (transactions: Transaction[]): string => {
  const mapping = analyzeTransactionsForMapping(transactions);
  return JSON.stringify(mapping, null, 2);
};