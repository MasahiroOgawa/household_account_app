import { Transaction } from '../types/Transaction';

export interface CategoryMappingStructure {
  categories: {
    income: string[];
    expense: string[];
  };
  mappings: {
    [description: string]: string;
  };
}

// Define categories as per user requirements
const defaultCategories = {
  income: ['salary', 'company_refund', 'country_refund', 'withdraw', 'others_income'],
  expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'others']
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
  'セブン－イレブン': 'grocery',
  '7-11': 'grocery',
  '７－１１': 'grocery',
  'ローソン': 'grocery',
  'ファミリーマート': 'grocery',
  'ファミマ': 'grocery',
  '西友': 'grocery',
  'イトーヨーカドー': 'grocery',
  '成城石井': 'grocery',
  'まいばすけっと': 'grocery',
  'ライフ': 'grocery',
  'アトレ': 'grocery',
  'コンビニ': 'grocery',
  '東急': 'grocery',
  'ﾄｳｷｭｳ': 'grocery',

  // Wear/Clothing patterns
  'ユニクロ': 'wear',
  'UNIQLO': 'wear',
  'ZARA': 'wear',
  'GU': 'wear',
  '無印良品': 'wear',
  'しまむら': 'wear',
  '衣': 'wear',
  '服': 'wear',

  // Housing patterns
  '家賃': 'housing',
  '住宅': 'housing',
  '管理費': 'housing',
  '修繕': 'housing',
  '不動産': 'housing',
  '賃貸': 'housing',

  // Utility patterns
  '電気': 'utility',
  'ガス': 'utility',
  '水道': 'utility',
  '電力': 'utility',
  '東京電力': 'utility',
  '東京ガス': 'utility',
  '携帯': 'utility',
  'ドコモ': 'utility',
  'docomo': 'utility',
  'au': 'utility',
  'ソフトバンク': 'utility',
  'softbank': 'utility',
  'インターネット': 'utility',
  'NTT': 'utility',
  '通信': 'utility',

  // Medical patterns
  '病院': 'medical',
  '薬局': 'medical',
  'クリニック': 'medical',
  '歯科': 'medical',
  '歯医者': 'medical',
  '医療': 'medical',
  'マツモトキヨシ': 'medical',
  'ウエルシア': 'medical',
  'ツルハ': 'medical',
  '薬': 'medical',

  // Education patterns
  '学校': 'education',
  '塾': 'education',
  '習い事': 'education',
  '予備校': 'education',
  '大学': 'education',
  '書籍': 'education',
  '本屋': 'education',
  '教育': 'education',
  '学習': 'education',

  // Leisure patterns
  'Netflix': 'leisure',
  'ネットフリックス': 'leisure',
  'Spotify': 'leisure',
  'YouTube': 'leisure',
  'ディズニー': 'leisure',
  '映画': 'leisure',
  'カラオケ': 'leisure',
  '旅行': 'leisure',
  'ホテル': 'leisure',
  'レストラン': 'leisure',
  'カフェ': 'leisure',
  'スタバ': 'leisure',
  'マクドナルド': 'leisure',
  'マック': 'leisure',
  '外食': 'leisure',
  'ゲーム': 'leisure',
  '娯楽': 'leisure',
  '遊': 'leisure',

  // Investment patterns
  '証券': 'invest',
  '株式': 'invest',
  'SBI': 'invest',
  '投資': 'invest',
  '積立': 'invest',
  '信託': 'invest',
  '楽天証券': 'invest',

  // Gift patterns
  'ギフト': 'gift',
  'プレゼント': 'gift',
  '贈': 'gift',
  'お祝い': 'gift',
  '花': 'gift',
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
          if (lowerDesc.includes('アトレ') || lowerDesc.includes('ｱﾄﾚ')) {
            suggestedCategory = 'grocery';
          } else if (lowerDesc.includes('東急') || lowerDesc.includes('ﾄｳｷｭｳ')) {
            suggestedCategory = 'grocery';
          } else if (lowerDesc.includes('ラクテン') || lowerDesc.includes('ﾗｸﾃﾝ')) {
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

  // Sort descriptions alphabetically (Japanese and English)
  const sortedDescriptions = Array.from(allDescriptions.keys()).sort((a, b) =>
    a.localeCompare(b, 'ja', { sensitivity: 'base' })
  );

  sortedDescriptions.forEach(description => {
    const info = allDescriptions.get(description)!;
    mappings[description] = info.suggestedCategory;
  });

  // Ensure specific mappings as requested by user
  mappings['アトレオオイマチ'] = 'grocery';

  // Add any descriptions that contain specific patterns
  Object.keys(mappings).forEach(desc => {
    if (desc.includes('ﾗｸﾃﾝﾍﾟｲ') && desc.includes('ﾄｳｷｭｳ')) {
      mappings[desc] = 'grocery';
    }
  });

  return {
    categories: defaultCategories,
    mappings: mappings
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

  // Log summary for user feedback
  // console.log('Generated category mapping with:', {
  //   incomeCategories: mapping.categories.income.length,
  //   expenseCategories: mapping.categories.expense.length,
  //   mappingsCount: Object.keys(mapping.mappings).length,
  //   descriptions: `All ${Object.keys(mapping.mappings).length} unique descriptions mapped`
  // });
};

// Export mapping for manual download
export const exportCategoryMapping = (transactions: Transaction[]): string => {
  const mapping = analyzeTransactionsForMapping(transactions);
  return JSON.stringify(mapping, null, 2);
};