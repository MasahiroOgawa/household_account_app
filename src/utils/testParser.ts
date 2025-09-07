import * as Papa from 'papaparse';
import { parseGenericCSV } from './genericCsvParser';
import { configLoader } from './configLoader';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';

// Test function to parse a CSV file and report results
async function testParseFile(filePath: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing file: ${path.basename(filePath)}`);
  console.log('='.repeat(60));
  
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Try to detect encoding
    let fileContent: string;
    const sourceConfig = configLoader.getColumnMapping().sources;
    
    // Try to detect file type from filename first
    let detectedType: string | null = null;
    for (const [sourceType, config] of Object.entries(sourceConfig)) {
      if (config.filename) {
        for (const pattern of config.filename) {
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
          const regex = new RegExp(regexPattern, 'i');
          if (regex.test(fileName)) {
            detectedType = sourceType;
            break;
          }
        }
      }
      if (detectedType) break;
    }
    
    // Get encoding based on detected type
    const encoding = detectedType && sourceConfig[detectedType] 
      ? sourceConfig[detectedType].encoding 
      : 'utf-8';
    
    console.log(`Detected type from filename: ${detectedType || 'none'}`);
    console.log(`Using encoding: ${encoding}`);
    
    // Convert file content based on encoding
    if (encoding.toLowerCase() === 'shift-jis') {
      fileContent = iconv.decode(fileBuffer, 'Shift_JIS');
    } else {
      fileContent = fileBuffer.toString('utf-8');
    }
    
    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: false,
      skipEmptyLines: true
    });
    
    const data = parseResult.data as any[][];
    console.log(`Total rows in file: ${data.length}`);
    
    // Show first few rows
    console.log('\nFirst 3 data rows:');
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`Row ${i}:`, data[i].slice(0, 6).map(cell => 
        cell ? cell.toString().substring(0, 30) : 'null'
      ));
    }
    
    // Try to detect file type using headers
    const headers = data[0] || [];
    const finalDetectedType = configLoader.detectFileType(headers, fileName);
    console.log(`\nFinal detected type: ${finalDetectedType}`);
    
    if (!finalDetectedType) {
      console.error('Could not detect file type!');
      return;
    }
    
    // Parse using generic parser
    const transactions = parseGenericCSV(data, finalDetectedType, fileName);
    
    console.log(`\n${'*'.repeat(40)}`);
    console.log(`RESULT: Parsed ${transactions.length} transactions`);
    console.log(`${'*'.repeat(40)}`);
    
    // Show sample transactions
    if (transactions.length > 0) {
      console.log('\nSample transactions:');
      for (let i = 0; i < Math.min(3, transactions.length); i++) {
        const t = transactions[i];
        console.log(`  ${i + 1}. ${t.date} | ${t.description.substring(0, 30)} | ¥${t.amount} | ${t.source}`);
      }
    }
    
    // Count by source
    const sourceCount: Record<string, number> = {};
    transactions.forEach(t => {
      sourceCount[t.source] = (sourceCount[t.source] || 0) + 1;
    });
    console.log('\nTransactions by source:', sourceCount);
    
  } catch (error) {
    console.error('Error testing file:', error);
  }
}

// Main test function
export async function runParserTests(): Promise<void> {
  console.log('Starting parser tests...\n');
  
  // Find test files
  const dataDir2024 = '/workspace/data/2024';
  const dataDir2025 = '/workspace/data/2025';
  
  const testFiles: string[] = [];
  
  // Find PayPay files
  if (fs.existsSync(dataDir2025)) {
    const files = fs.readdirSync(dataDir2025);
    const paypayFiles = files.filter(f => f.includes('2156'));
    paypayFiles.forEach(f => testFiles.push(path.join(dataDir2025, f)));
  }
  
  // Find Orico/KAL files
  if (fs.existsSync(dataDir2024)) {
    const files = fs.readdirSync(dataDir2024);
    const oricoFiles = files.filter(f => f.startsWith('KAL'));
    oricoFiles.slice(0, 2).forEach(f => testFiles.push(path.join(dataDir2024, f))); // Test first 2
  }
  
  // Find UFJ files for comparison
  if (fs.existsSync(dataDir2024)) {
    const files = fs.readdirSync(dataDir2024);
    const ufjFiles = files.filter(f => f.match(/^\d{7}_/));
    ufjFiles.slice(0, 1).forEach(f => testFiles.push(path.join(dataDir2024, f))); // Test first 1
  }
  
  console.log(`Found ${testFiles.length} test files`);
  
  // Test each file
  for (const file of testFiles) {
    await testParseFile(file);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runParserTests().catch(console.error);
}