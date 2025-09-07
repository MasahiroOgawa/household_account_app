const fs = require('fs');
const iconv = require('iconv-lite');

// Test Orico date and amount parsing
const filePath = './data/2024/KAL1B10001020250812144205829.csv';
const fileBuffer = fs.readFileSync(filePath);
const fileContent = iconv.decode(fileBuffer, 'Shift_JIS');

const lines = fileContent.split('\n');
console.log('Total lines:', lines.length);
console.log('\nChecking Orico data rows (starting from row 10):');

for (let i = 10; i < Math.min(15, lines.length); i++) {
  const line = lines[i];
  if (!line) continue;
  
  const cols = line.split(',');
  console.log(`\nRow ${i}:`);
  console.log(`  Date (col 0): "${cols[0]}"`);
  console.log(`  Description (col 1): "${cols[1]}"`);
  console.log(`  Amount (col 8): "${cols[8]}"`);
  
  // Test date parsing
  const dateStr = cols[0];
  if (dateStr) {
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) {
      console.log(`  ✓ Date parsed: ${match[1]}-${match[2]}-${match[3]}`);
    } else {
      console.log(`  ✗ Date failed to parse`);
    }
  }
  
  // Test amount parsing
  const amountStr = cols[8];
  if (amountStr) {
    const cleaned = amountStr.replace(/[¥"]/g, '').replace(/,/g, '');
    const amount = parseFloat(cleaned);
    console.log(`  Amount parsed: ${amount}`);
  }
}