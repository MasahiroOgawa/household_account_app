// Test script to debug category mapping generation
const fs = require('fs');
const path = require('path');

// Read a sample PayPay CSV file
const paypayFile = path.join(__dirname, 'data/2025/detail202510(2156).csv');
const content = fs.readFileSync(paypayFile, 'utf-8');

console.log('PayPay CSV first 500 chars:');
console.log(content.substring(0, 500));
console.log('\n---\n');

// Split into lines and parse
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
console.log('\nFirst 3 lines:');
lines.slice(0, 3).forEach((line, i) => {
  console.log(`Line ${i}:`, line);
});

console.log('\n---\n');

// Parse CSV manually to see structure
const rows = lines.slice(1).filter(l => l.trim()).map(line => {
  // Simple CSV parsing (doesn't handle all edge cases)
  const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  return matches ? matches.map(m => m.replace(/^"|"$/g, '')) : [];
});

console.log('First 5 parsed rows:');
rows.slice(0, 5).forEach((row, i) => {
  console.log(`Row ${i}:`, row);
  if (row[1]) {
    console.log(`  -> Shop name (column 1): "${row[1]}"`);
  }
});
