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
  income: ['salary', 'company_refund', 'country_refund', 'withdraw', 'other_income'],
  expense: ['invest', 'education', 'grocery', 'wear', 'housing', 'utility', 'medical', 'leisure', 'gift', 'other_expense']
};

// Common patterns for initial categorization - more comprehensive list
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
  '振込': 'withdraw',

  // Grocery patterns
  'スーパー': 'grocery',
  'イオン': 'grocery',
  'セブンイレブン': 'grocery',
  'セブン-イレブン': 'grocery',
  'セブン－イレブン': 'grocery',
  '7-11': 'grocery',
  '７－１１': 'grocery',
  '７＆ｉ': 'grocery',
  'ローソン': 'grocery',
  'ファミリーマート': 'grocery',
  'ファミマ': 'grocery',
  '西友': 'grocery',
  'イトーヨーカドー': 'grocery',
  '成城石井': 'grocery',
  'まいばすけっと': 'grocery',
  'マイバスケット': 'grocery',
  'ライフ': 'grocery',
  'アトレ': 'grocery',
  'コンビニ': 'grocery',
  '東急': 'grocery',
  'ﾄｳｷｭｳ': 'grocery',
  'サミット': 'grocery',
  'ｻﾐｯﾄ': 'grocery',
  'マルエツ': 'grocery',
  'ﾏﾙｴﾂ': 'grocery',
  'ヴィドフランス': 'grocery',
  'ｳﾞｨﾄﾞﾌﾗﾝｽ': 'grocery',
  'ラム': 'grocery',
  'ﾗﾑｰ': 'grocery',

  // Wear/Clothing patterns
  'ユニクロ': 'wear',
  'ﾕﾆｸﾛ': 'wear',
  'UNIQLO': 'wear',
  'ZARA': 'wear',
  'GU': 'wear',
  '無印良品': 'wear',
  'ムジルシ': 'wear',
  'ﾑｼﾞﾙｼ': 'wear',
  'しまむら': 'wear',
  'ワークマン': 'wear',
  'ﾜｰｸﾏﾝ': 'wear',
  '衣': 'wear',
  '服': 'wear',

  // Housing patterns
  '家賃': 'housing',
  '住宅': 'housing',
  '管理費': 'housing',
  '修繕': 'housing',
  '不動産': 'housing',
  '賃貸': 'housing',
  'ニトリ': 'housing',
  'ﾆﾄﾘ': 'housing',
  'IKEA': 'housing',

  // Utility patterns
  '電気': 'utility',
  'ガス': 'utility',
  '水道': 'utility',
  '電力': 'utility',
  '東京電力': 'utility',
  '東京ガス': 'utility',
  '携帯': 'utility',
  'ドコモ': 'utility',
  'ﾄﾞｺﾓ': 'utility',
  'docomo': 'utility',
  'au': 'utility',
  'ソフトバンク': 'utility',
  'softbank': 'utility',
  '楽天モバイル': 'utility',
  'ﾗｸﾃﾝﾓﾊﾞｲﾙ': 'utility',
  'インターネット': 'utility',
  'NTT': 'utility',
  '通信': 'utility',

  // Medical patterns
  '病院': 'medical',
  '薬局': 'medical',
  '薬': 'medical',
  'クリニック': 'medical',
  '歯科': 'medical',
  '歯医者': 'medical',
  '医療': 'medical',
  'マツモトキヨシ': 'medical',
  'ﾏﾂﾓﾄｷﾖｼ': 'medical',
  'ウエルシア': 'medical',
  'ツルハ': 'medical',
  'スギ薬局': 'medical',
  'ｽｷﾞﾔｸｷｮｸ': 'medical',
  'クリエイト': 'medical',
  'ｸﾘｴｲﾄ': 'medical',

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
  'ブックオフ': 'education',
  'ﾌﾞｯｸｵﾌ': 'education',

  // Leisure patterns
  'Netflix': 'leisure',
  'ネットフリックス': 'leisure',
  'Spotify': 'leisure',
  'YouTube': 'leisure',
  'ディズニー': 'leisure',
  '映画': 'leisure',
  'カラオケ': 'leisure',
  '旅行': 'leisure',
  'Trip': 'leisure',
  'Ｔｒｉｐ': 'leisure',
  'Ｔｒｉｐ．ｃｏｍ': 'leisure',
  'Trip.com': 'leisure',
  '一休': 'leisure',
  '一休．ｃｏｍ': 'leisure',
  'ホテル': 'leisure',
  'レストラン': 'leisure',
  'カフェ': 'leisure',
  'スタバ': 'leisure',
  'スターバックス': 'leisure',
  'マクドナルド': 'leisure',
  'ﾏｸﾄﾞﾅﾙﾄﾞ': 'leisure',
  'マック': 'leisure',
  'バーガーキング': 'leisure',
  'ﾊﾞｰｶﾞｰｷﾝｸﾞ': 'leisure',
  '外食': 'leisure',
  'ゲーム': 'leisure',
  '娯楽': 'leisure',
  '遊': 'leisure',
  'すし': 'leisure',
  'スシロー': 'leisure',
  'ｽｼﾛｰ': 'leisure',
  'トラットリア': 'leisure',
  'ﾄﾗｯﾄﾘｱ': 'leisure',
  'パイルダーオン': 'leisure',
  'ﾊﾟｲﾙﾀﾞｰｵﾝ': 'leisure',
  'タイトー': 'leisure',
  'ﾀｲﾄｰ': 'leisure',
  'カクヤス': 'leisure',
  'ｶｸﾔｽ': 'leisure',
  'タクシー': 'leisure',
  'ﾀｸｼｰ': 'leisure',
  'フィットネス': 'leisure',
  'ﾌｨｯﾄﾈｽ': 'leisure',
  'ANYTIME': 'leisure',

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

  // Others - general shopping
  'Amazon': 'other_expense',
  'AMAZON': 'other_expense',
  'アマゾン': 'other_expense',
  'ｱﾏｿﾞﾝ': 'other_expense',
  'ヤマダ': 'other_expense',
  'ﾔﾏﾀﾞ': 'other_expense',
  'ビックカメラ': 'other_expense',
  'ﾋﾞｯｸｶﾒﾗ': 'other_expense',
  'ケーズデンキ': 'other_expense',
  'ｹｰｽﾞﾃﾞﾝｷ': 'other_expense',
  'ドンキ': 'other_expense',
  'ﾄﾞﾝ･ｷﾎｰﾃ': 'other_expense',
  'ダイソー': 'other_expense',
  'ﾀﾞｲｿｰ': 'other_expense',
  'ワッツ': 'other_expense',
  'ﾜｯﾂ': 'other_expense',
  'コーナン': 'other_expense',
  'ｺｰﾅﾝ': 'other_expense',
};

// Analyze transactions to generate mappings with ALL descriptions
export const analyzeTransactionsForMapping = (transactions: Transaction[]): CategoryMappingStructure => {
  const allDescriptions = new Map<string, { count: number; type: 'income' | 'expense'; suggestedCategory: string }>();

  console.log(`Analyzing ${transactions.length} transactions for category mapping...`);

  // Collect ALL unique descriptions from transactions
  transactions.forEach(transaction => {
    // Get the exact description as it appears in the data
    const description = transaction.description;
    if (!description || description.trim() === '') return;

    // Use the exact description (don't trim or modify it)
    const key = description;

    // Store the description with its frequency and type
    const existing = allDescriptions.get(key);
    if (existing) {
      existing.count++;
    } else {
      // Try to determine category based on patterns
      let suggestedCategory = '';
      const lowerDesc = description.toLowerCase();

      // Check for pattern matches (check longer patterns first)
      const sortedPatterns = Object.entries(commonPatterns).sort((a, b) => b[0].length - a[0].length);

      for (const [pattern, category] of sortedPatterns) {
        if (lowerDesc.includes(pattern.toLowerCase())) {
          suggestedCategory = category;
          break;
        }
      }

      // If no pattern matched, assign default category based on transaction type
      if (!suggestedCategory) {
        if (transaction.type === 'income') {
          // More specific income detection
          if (lowerDesc.includes('給') || lowerDesc.includes('賞与') || lowerDesc.includes('salary')) {
            suggestedCategory = 'salary';
          } else if (lowerDesc.includes('還付') || lowerDesc.includes('税') || lowerDesc.includes('refund')) {
            suggestedCategory = 'country_refund';
          } else if (lowerDesc.includes('返金') || lowerDesc.includes('払戻')) {
            suggestedCategory = 'company_refund';
          } else if (lowerDesc.includes('atm') || lowerDesc.includes('出金') || lowerDesc.includes('引出')) {
            suggestedCategory = 'withdraw';
          } else {
            suggestedCategory = 'other_income';
          }
        } else {
          // More specific expense detection
          if (lowerDesc.includes('.com') || lowerDesc.includes('ｃｏｍ')) {
            suggestedCategory = 'leisure'; // For Trip.com etc
          } else {
            suggestedCategory = 'other_expense';
          }
        }
      }

      allDescriptions.set(key, {
        count: 1,
        type: transaction.type as 'income' | 'expense',
        suggestedCategory: suggestedCategory
      });
    }
  });

  console.log(`Found ${allDescriptions.size} unique descriptions`);

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

  // Log some examples
  const examples = Object.entries(mappings).slice(0, 5);
  console.log('Sample mappings:', examples);

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
  a.download = 'categoryMapping.json'; // Changed from categoryMapping_generated.json
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Generated category mapping with:', {
    incomeCategories: mapping.categories.income.length,
    expenseCategories: mapping.categories.expense.length,
    mappingsCount: Object.keys(mapping.mappings).length,
    descriptions: `All ${Object.keys(mapping.mappings).length} unique descriptions mapped`
  });

  // Alert user
  alert(`Category mapping generated successfully!\n\n` +
    `✓ ${Object.keys(mapping.mappings).length} unique descriptions mapped\n` +
    `✓ File downloaded as: categoryMapping.json\n\n` +
    `Please review and edit the mappings, then save to data/categoryMapping.json`);
};

// Export mapping for manual download
export const exportCategoryMapping = (transactions: Transaction[]): string => {
  const mapping = analyzeTransactionsForMapping(transactions);
  return JSON.stringify(mapping, null, 2);
};