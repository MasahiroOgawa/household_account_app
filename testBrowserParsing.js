import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { parseGenericCSV } from './src/utils/genericCsvParser.js';
import { configLoader } from './src/utils/configLoader.js';

// Simulate browser File object
class FakeFile {
  constructor(filePath) {
    this.path = filePath;
    this.name = path.basename(filePath);
    this.buffer = fs.readFileSync(filePath);
  }
  
  // Simulate browser File.text() method
  async text() {
    return this.buffer.toString('utf-8');
  }
  
  // For PapaParse
  slice() {
    return this;
  }
  
  async arrayBuffer() {
    return this.buffer.buffer;
  }
}

// Override PapaParse to handle our fake file
const originalParse = Papa.parse;
Papa.parse = function(file, options) {
  if (file instanceof FakeFile) {
    // Just pass the buffer content
    return originalParse(file.buffer.toString('utf-8'), options);
  }
  return originalParse(file, options);
};

async function testFile(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing: ${path.basename(filePath)}`);
  console.log('='.repeat(60));
  
  const file = new FakeFile(filePath);
  
  // Try to detect type from filename
  const preliminaryType = configLoader.detectFileType([], file.name);
  console.log(`Preliminary type from filename: ${preliminaryType}`);
  
  // Get encoding
  let encoding = "UTF-8";
  if (preliminaryType) {
    const sourceConfig = configLoader.getSourceConfig(preliminaryType);
    if (sourceConfig?.encoding) {
      encoding = sourceConfig.encoding;
      console.log(`Using encoding from config: ${encoding}`);
    }
  }
  
  // Parse the file
  return new Promise((resolve) => {
    Papa.parse(file, {
      encoding: encoding,
      complete: (results) => {
        const data = results.data;
        console.log(`Parsed ${data.length} rows`);
        
        // Show first few rows
        console.log('First 3 rows:');
        for (let i = 0; i < Math.min(3, data.length); i++) {
          console.log(`  Row ${i}:`, data[i]?.slice(0, 5));
        }
        
        // Detect file type
        const detectedType = configLoader.detectFileType(data[0] || [], file.name);
        console.log(`Final detected type: ${detectedType}`);
        
        if (!detectedType) {
          console.log('ERROR: Could not detect file type!');
          resolve(0);
          return;
        }
        
        // Parse transactions
        const transactions = parseGenericCSV(data, detectedType, file.name);
        console.log(`\n*** RESULT: ${transactions.length} transactions parsed ***`);
        
        if (transactions.length > 0) {
          console.log('Sample transactions:');
          transactions.slice(0, 3).forEach((t, i) => {
            console.log(`  ${i+1}. ${t.date} | ${t.description?.substring(0, 30)} | ¥${t.amount}`);
          });
        }
        
        resolve(transactions.length);
      }
    });
  });
}

// Test files
async function runTests() {
  console.log('Testing Browser-like Parsing\n');
  
  const testFiles = [];
  
  // Add PayPay files
  if (fs.existsSync('./data/2025')) {
    const files = fs.readdirSync('./data/2025');
    files.filter(f => f.includes('2156') && !f.startsWith('.')).slice(0, 1)
      .forEach(f => testFiles.push(`./data/2025/${f}`));
  }
  
  // Add Orico files
  if (fs.existsSync('./data/2024')) {
    const files = fs.readdirSync('./data/2024');
    files.filter(f => f.startsWith('KAL')).slice(0, 1)
      .forEach(f => testFiles.push(`./data/2024/${f}`));
  }
  
  // Add UFJ file for comparison
  if (fs.existsSync('./data/2024')) {
    const files = fs.readdirSync('./data/2024');
    files.filter(f => f.match(/^\d{7}_/)).slice(0, 1)
      .forEach(f => testFiles.push(`./data/2024/${f}`));
  }
  
  let total = 0;
  for (const file of testFiles) {
    const count = await testFile(file);
    total += count;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL TRANSACTIONS: ${total}`);
  console.log('='.repeat(60));
}

runTests().catch(console.error);