const { mapToNewCategory } = require('./src/utils/categoryMapper');

// Test data for category mapping
const testCases = [
  // Kids - Bank transfers to other people
  { 
    oldCategory: 'Bank Transfer', 
    description: '振込 田中太郎', 
    shopName: '田中太郎',
    amount: 10000,
    source: 'UFJ Bank',
    expected: 'kids'
  },
  
  // Food - Restaurants and groceries
  {
    oldCategory: 'Groceries',
    description: 'セブンイレブン',
    shopName: 'セブンイレブン',
    amount: 500,
    source: 'PayPay',
    expected: 'food'
  },
  {
    oldCategory: 'Dining',
    description: 'マクドナルド',
    shopName: 'マクドナルド',
    amount: 1200,
    source: 'Orico Card',
    expected: 'food'
  },
  
  // Housing - Utilities and rent
  {
    oldCategory: 'Utilities',
    description: '東京電力',
    shopName: '東京電力',
    amount: 8000,
    source: 'UFJ Bank',
    expected: 'housing'
  },
  {
    oldCategory: 'Rent',
    description: '家賃',
    shopName: '不動産管理会社',
    amount: 100000,
    source: 'UFJ Bank',
    expected: 'housing'
  },
  
  // Education
  {
    oldCategory: 'Education',
    description: '早稲田大学 授業料',
    shopName: '早稲田大学',
    amount: 500000,
    source: 'UFJ Bank',
    expected: 'education'
  },
  {
    oldCategory: 'Other',
    description: '公文教室',
    shopName: '公文',
    amount: 8000,
    source: 'Orico Card',
    expected: 'education'
  },
  
  // Leisure
  {
    oldCategory: 'Hobby',
    description: '映画館',
    shopName: 'TOHOシネマズ',
    amount: 1800,
    source: 'PayPay',
    expected: 'leisure'
  },
  {
    oldCategory: 'Shopping',
    description: 'ユニクロ',
    shopName: 'ユニクロ',
    amount: 5000,
    source: 'Orico Card',
    expected: 'leisure'
  },
  
  // Others
  {
    oldCategory: 'ATM',
    description: 'ATM引出',
    shopName: 'ATM',
    amount: 10000,
    source: 'UFJ Bank',
    expected: 'others'
  },
  {
    oldCategory: 'Insurance',
    description: '生命保険',
    shopName: '保険会社',
    amount: 15000,
    source: 'SMBC Bank',
    expected: 'others'
  }
];

console.log('Testing Category Mapping...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = mapToNewCategory(
    test.oldCategory,
    test.description,
    test.shopName,
    test.amount,
    test.source
  );
  
  if (result === test.expected) {
    console.log(`✅ Test ${index + 1} PASSED: ${test.description} -> ${result}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1} FAILED: ${test.description}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);