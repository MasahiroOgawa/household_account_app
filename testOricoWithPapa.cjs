const Papa = require('papaparse');
const fs = require('fs');
const iconv = require('iconv-lite');

// Test Orico with PapaParse
const filePath = './data/2024/KAL1B10001020250812144205829.csv';
const fileBuffer = fs.readFileSync(filePath);
const fileContent = iconv.decode(fileBuffer, 'Shift_JIS');

console.log('Parsing with PapaParse...\n');

const result = Papa.parse(fileContent, {
  header: false,
  skipEmptyLines: true
});

const data = result.data;
console.log('Total rows:', data.length);
console.log('\nChecking rows 10-14:');

for (let i = 10; i < Math.min(15, data.length); i++) {
  const row = data[i];
  console.log(`\nRow ${i}:`);
  console.log(`  Columns: ${row.length}`);
  console.log(`  Date (col 0): "${row[0]}"`);
  console.log(`  Description (col 1): "${row[1]}"`);
  console.log(`  Amount (col 8): "${row[8]}"`);
  
  // Show all columns for debugging
  if (i === 10) {
    console.log('  All columns:');
    row.forEach((col, idx) => {
      if (col) console.log(`    [${idx}]: "${col}"`);
    });
  }
}