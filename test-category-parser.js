// Simple test to verify category mapping in CSV parsing
const fs = require('fs');

// Read and display first few lines of a sample CSV to understand the data
const sampleFiles = [
  'data/paypay_sample.csv',
  'data/ufj_sample.csv',
  'data/orico_sample.csv'
];

console.log('Checking sample CSV files to understand data format:\n');

sampleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`\n📁 ${file}:`);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').slice(0, 5);
    lines.forEach((line, i) => {
      console.log(`   Line ${i}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
  } else {
    console.log(`\n❌ ${file} not found`);
  }
});

// Check what categories would be assigned to common transactions
console.log('\n\n🏷️  Category Mapping Examples:');
console.log('================================');

const exampleTransactions = [
  { desc: '振込 山田太郎', expected: 'kids (personal transfer)' },
  { desc: 'セブンイレブン', expected: 'food (convenience store)' },
  { desc: 'イオン', expected: 'food (supermarket)' },
  { desc: 'マクドナルド', expected: 'food (restaurant)' },
  { desc: '東京電力', expected: 'housing (utilities)' },
  { desc: '家賃', expected: 'housing (rent)' },
  { desc: '早稲田大学', expected: 'education (university)' },
  { desc: '公文', expected: 'education (cram school)' },
  { desc: 'ユニクロ', expected: 'leisure (shopping)' },
  { desc: '映画館', expected: 'leisure (entertainment)' },
  { desc: 'ATM引出', expected: 'others' },
  { desc: '楽天証券', expected: 'others (investment)' },
  { desc: 'PayPay チャージ', expected: 'others (e-money)' }
];

exampleTransactions.forEach(ex => {
  console.log(`  ${ex.desc.padEnd(20)} → ${ex.expected}`);
});