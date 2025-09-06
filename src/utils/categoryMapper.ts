export type NewCategory = 'kids' | 'food' | 'housing' | 'education' | 'leisure' | 'others';

interface CategoryMapping {
  keywords: string[];
  oldCategories: string[];
}

const categoryMappings: Record<NewCategory, CategoryMapping> = {
  kids: {
    keywords: [
      '子供', '子ども', 'こども', 'キッズ', 'ベビー', '保育', '託児',
      'トイザらス', 'ベビーザらス', '西松屋', 'アカチャンホンポ',
      '赤ちゃん', '児童', '学童', 'kids', 'baby', 'child'
    ],
    oldCategories: []
  },
  
  food: {
    keywords: [
      // Supermarkets
      'スーパー', 'イオン', 'イトーヨーカドー', 'マルエツ', 'サミット',
      'ライフ', 'オーケー', 'ヨークマート', '西友', 'コープ', 'サンプラザ',
      'まいばすけっと', 'マイバスケット', 'ピーコック', 'ベルクス', 'ヤオコー',
      // Convenience stores
      'コンビニ', 'セブン', 'ローソン', 'ファミリーマート', 'ファミマ',
      'ミニストップ', 'デイリーヤマザキ', 'サンクス', 'ポプラ', 'セイコーマート',
      // Restaurants
      'レストラン', '居酒屋', 'カフェ', '食堂', 'ヤキトンタチキ', '飲食店',
      'マクドナルド', 'マック', 'ケンタッキー', 'kfc', 'スターバックス', 'スタバ',
      'ドトール', 'タリーズ', 'すき家', '吉野家', 'なか卯', '松屋', 'てんや',
      'ガスト', 'ジョナサン', 'デニーズ', 'ロイヤルホスト', 'サイゼリヤ', 'バーミヤン',
      '回転寿司', '寿司', 'ラーメン', 'うどん', 'そば', '焼肉', '焼き肉', '鳥貴族',
      'ピザ', 'パン屋', 'ベーカリー', 'ケーキ', 'スイーツ', 'モスバーガー', 'モス',
      'ミスタードーナツ', 'ミスド', 'サブウェイ', 'ロッテリア', 'フレッシュネス',
      // Food delivery
      'ウーバーイーツ', 'uber eats', '出前館', 'demaecan', 'ウォルト', 'wolt',
      // Food related
      '食品', '食料', '飲食', '飲料', '酒', 'food', 'eat', 'drink', '弁当', '惣菜',
      '肉', '魚', '野菜', '米', 'パスタ', '麺', '茶', 'コーヒー'
    ],
    oldCategories: ['Groceries', 'Dining', 'Food', 'Groceries']
  },
  
  housing: {
    keywords: [
      // Rent and housing
      '家賃', '賃貸', '管理費', '共益費', '住宅', '不動産', 'マンション',
      // Utilities
      '東京ガス', 'ガス', '東京電力', '電力', '電気', '水道', '水道局',
      'でんき', 'ガス代', '電気代', '水道代', 'ＮＨＫ', 'nhk',
      // Internet/Phone
      'ソフトバンク', 'softbank', 'ドコモ', 'docomo', 'au', 'kddi',
      'インターネット', 'ネット', 'wifi', 'プロバイダ',
      // Home maintenance
      '修理', '修繕', 'リフォーム', '工事', '清掃', 'クリーニング',
      '引越', '引っ越し', 'ハウスクリーニング'
    ],
    oldCategories: ['Utilities', 'Rent', 'Housing']
  },
  
  education: {
    keywords: [
      // Schools and universities  
      '学校', '学費', '授業料', '入学金', '教材', '教科書',
      '大学', '専門学校', '高校', '中学', '小学校', '幼稚園',
      '早稲田', '慶応', '東大', '東京大学', 'ワセダ',
      // Cram schools and lessons
      '塾', '予備校', '家庭教師', '公文', 'くもん', 'kumon',
      'ベネッセ', '進研ゼミ', 'z会', 'ゼミ',
      // Lessons
      'レッスン', '習い事', 'ピアノ', '英会話', '英語', 'スイミング',
      '水泳', 'バレエ', 'ダンス', '空手', '柔道', '剣道', 'そろばん',
      // Educational materials
      '参考書', '問題集', '辞書', '図鑑', 'ドリル',
      // Other education
      '教育', '学習', '勉強', 'education', 'school', 'university'
    ],
    oldCategories: ['Education']
  },
  
  leisure: {
    keywords: [
      // Entertainment
      '映画', 'シネマ', 'ゲーム', 'カラオケ', 'ボウリング', 'ビリヤード', 'パチンコ',
      'ディズニー', 'disney', 'ユニバーサル', 'usj', '遊園地', 'テーマパーク', '動物園',
      '水族館', '博物館', '美術館', 'ミュージアム', 'コンサート', 'ライブ', '劇場',
      // Travel  
      '旅行', 'ホテル', '宿泊', '温泉', '観光', 'ツアー', 'トラベル', '旅館', '民宿',
      'jr', 'ジェイアール', '新幹線', '飛行機', '航空', 'ana', 'jal', 'ピーチ', 'ジェットスター',
      '成田', '羽田', '空港', 'タクシー', 'バス', '地下鉄', 'メトロ', 'レンタカー',
      // Sports and fitness
      'ジム', 'フィットネス', 'スポーツ', 'ゴルフ', 'テニス', 'ヨガ', 'ピラティス',
      'プール', 'スキー', 'スノボ', 'キャンプ', 'アウトドア', '釣り', '登山', 'ランニング',
      // Hobbies
      '本屋', '書店', 'ブック', 'book', '音楽', 'ミュージック', 'cd', 'dvd', 'ブルーレイ',
      'ネットフリックス', 'netflix', 'アマゾンプライム', 'prime', 'hulu', 'ディズニープラス',
      'spotify', 'apple music', 'youtube', 'ニコニコ', 'steam', 'プレイステーション',
      'nintendo', '任天堂', 'xbox', 'ソニー',
      // Shopping (non-essential)
      'アパレル', 'ファッション', 'ユニクロ', 'uniqlo', 'gu', 'zara', 'gap', 'しまむら',
      'h&m', '無印', 'muji', '洋服', '服', '靴', 'バッグ', 'アクセサリー', 'ニトリ',
      'ikea', 'イケア', '東急ハンズ', 'ロフト', 'loft', 'ドンキ', 'ドンキホーテ',
      // Online shopping
      'amazon', 'アマゾン', '楽天', 'rakuten', 'ヤフー', 'yahoo', 'メルカリ', 'ラクマ',
      'ヤフオク', 'ペイペイモール', 'paypay', 'zozotown', 'ゾゾタウン',
      // Beauty
      '美容', 'ビューティー', '化粧', 'コスメ', 'エステ', 'ネイル', 'マッサージ',
      'ヘアサロン', '美容院', '理容', '床屋', 'カット', 'パーマ', 'カラー', 'トリートメント'
    ],
    oldCategories: ['Hobby', 'Entertainment', 'Travel', 'Shopping', 'Online Shopping', 'Transportation']
  },
  
  others: {
    keywords: [
      // Medical
      '病院', 'クリニック', '医院', '診療所', '薬局', 'ドラッグストア', '薬',
      'マツモトキヨシ', 'ウエルシア', 'ツルハ', 'サンドラッグ', 'ココカラファイン',
      // Financial
      'atm', '引出', '預入', '振込', '振替', '送金', '手数料',
      // Cards and payments
      'カード', 'card', 'オリコ', 'orico', 'ビザ', 'visa', 'マスター', 'master',
      'jcb', 'アメックス', 'amex', 'ダイナース',
      // Insurance
      '保険', '生命', '損保', '年金', '共済',
      // Investment
      '証券', '投資', '株', 'sbi', 'マネックス', 'monex', '松井', 'カブドットコム'
    ],
    oldCategories: [
      'Other', 'Life', 'Bank Transfer', 'Bank Fee', 'Credit Card',
      'Credit Card Payment', 'ATM', 'E-Money Transfer', 'Healthcare',
      'Insurance', 'Investment', 'Investment Income', 'Interest Income',
      'Salary', 'Tax'
    ]
  }
};

export function mapToNewCategory(
  oldCategory: string,
  description: string,
  shopName: string,
  amount: number,
  source: string
): NewCategory {
  const combined = `${oldCategory} ${description} ${shopName}`.toLowerCase();
  
  // Special case: Check if it's a transfer to another person (kids category)
  if (isTransferToOtherPerson(description, source, amount)) {
    return 'kids';
  }
  
  // Check keyword matches for each category
  for (const [newCat, mapping] of Object.entries(categoryMappings)) {
    if (newCat === 'others') continue; // Check 'others' last
    
    // Check if old category matches
    if (mapping.oldCategories.includes(oldCategory)) {
      return newCat as NewCategory;
    }
    
    // Check keywords
    for (const keyword of mapping.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return newCat as NewCategory;
      }
    }
  }
  
  // Default to 'others'
  return 'others';
}

function isTransferToOtherPerson(
  description: string,
  source: string,
  amount: number
): boolean {
  const desc = description.toLowerCase();
  
  // Check if it's a bank transfer from UFJ, SMBC, or JRE
  const isBankTransfer = ['UFJ', 'SMBC Bank', 'JRE Bank'].includes(source) &&
    (desc.includes('振込') || desc.includes('振替'));
  
  if (!isBankTransfer) return false;
  
  // Exclude transfers that are likely NOT to other people (kids)
  const excludePatterns = [
    // Own accounts
    '自分', '本人', 'じぶん', 'ホンニン',
    // Credit cards
    'カード', 'card', 'オリコ', 'orico', 'ミツイスミトモ', '三井住友',
    // Investment/Securities
    '証券', '投資', 'ラクテン', 'rakuten', 'sbi', 'マネックス',
    // Insurance
    '保険', '生命', '損保', 'ソンガイ',
    // Utilities/Services
    '電気', 'ガス', '水道', 'ＮＨＫ', 'nhk',
    // E-money
    'paypay', 'ペイペイ',
    // Fees
    '手数料',
    // Rent
    '家賃', '賃貸', '管理費',
    // Education institutions
    '大学', '学校', '学費'
  ];
  
  for (const pattern of excludePatterns) {
    if (desc.includes(pattern)) {
      return false;
    }
  }
  
  // If it's a bank transfer and doesn't match exclusion patterns,
  // it's likely a transfer to another person
  return true;
}

export function getCategoryDisplayName(category: string | NewCategory): string {
  const displayNames: Record<NewCategory, string> = {
    kids: 'Kids',
    food: 'Food',
    housing: 'Housing',
    education: 'Education', 
    leisure: 'Leisure',
    others: 'Others'
  };
  // If it's a new category, use the display name
  if (category in displayNames) {
    return displayNames[category as NewCategory];
  }
  // Otherwise return the category as-is (for backward compatibility)
  return category;
}

export function getCategoryColor(category: string | NewCategory): string {
  const colors: Record<NewCategory, string> = {
    kids: '#FF6B6B',      // Red
    food: '#4ECDC4',      // Teal
    housing: '#45B7D1',   // Blue
    education: '#96CEB4', // Green
    leisure: '#FFEAA7',   // Yellow
    others: '#A8A8A8'     // Gray
  };
  // If it's a new category, use the color
  if (category in colors) {
    return colors[category as NewCategory];
  }
  // Otherwise return a default color (for backward compatibility)
  return '#A8A8A8'; // Gray for unknown categories
}