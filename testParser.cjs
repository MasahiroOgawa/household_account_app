const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Load configurations
const columnMapping = JSON.parse(fs.readFileSync('./data/columnMapping.json', 'utf8'));
const categoryMapping = JSON.parse(fs.readFileSync('./data/categoryMapping.json', 'utf8'));

// Detect file type
function detectFileType(headers, fileName) {
  const lowerFileName = fileName.toLowerCase();
  
  console.log(`Detecting type for: ${fileName}`);
  console.log(`Headers:`, headers.slice(0, 5));
  
  // Check filename patterns in sources
  for (const [sourceType, config] of Object.entries(columnMapping.sources)) {
    if (config.filename) {
      for (const pattern of config.filename) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(fileName)) {
          console.log(`Filename matched pattern "${pattern}" for type: ${sourceType}`);
          return sourceType;
        }
      }
    }
  }
  
  // Check detection rules
  for (const [sourceType, rules] of Object.entries(columnMapping.detectionRules)) {
    // Check filename pattern
    if (rules.fileNamePattern) {
      const regex = new RegExp(rules.fileNamePattern, 'i');
      if (regex.test(fileName)) {
        console.log(`Filename matched detection rule for type: ${sourceType}`);
        return sourceType;
      }
    }
    
    // Check header patterns
    if (headers.length > 0 && rules.headerPatterns && rules.headerPatterns.length > 0) {
      const headerMatch = rules.headerPatterns.every(pattern => 
        headers.some(header => header && header.includes(pattern))
      );
      if (headerMatch) {
        console.log(`Headers matched patterns for type: ${sourceType}`);
        return sourceType;
      }
    }
  }
  
  return null;
}

// Parse CSV file
function parseCSVFile(filePath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing file: ${path.basename(filePath)}`);
  console.log('='.repeat(60));
  
  const fileName = path.basename(filePath);
  
  // Try to detect type from filename first
  let detectedType = null;
  for (const [sourceType, config] of Object.entries(columnMapping.sources)) {
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
  
  const encoding = detectedType && columnMapping.sources[detectedType]
    ? columnMapping.sources[detectedType].encoding
    : 'utf-8';
  
  console.log(`Preliminary type from filename: ${detectedType || 'none'}`);
  console.log(`Using encoding: ${encoding}`);
  
  // Read file with correct encoding
  const fileBuffer = fs.readFileSync(filePath);
  let fileContent;
  
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
  
  const data = parseResult.data;
  console.log(`Total rows in file: ${data.length}`);
  
  // Show first few rows
  console.log('\nFirst 5 rows:');
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (row) {
      console.log(`Row ${i}: [${row.slice(0, 6).map(cell => 
        cell ? `"${cell.toString().substring(0, 20)}${cell.toString().length > 20 ? '...' : ''}"` : 'null'
      ).join(', ')}]`);
    }
  }
  
  // Detect file type
  const headers = data[0] || [];
  const finalType = detectFileType(headers, fileName);
  console.log(`\nFinal detected type: ${finalType}`);
  
  if (!finalType) {
    console.error('ERROR: Could not detect file type!');
    return;
  }
  
  // Get configuration
  const config = columnMapping.sources[finalType];
  if (!config) {
    console.error(`ERROR: No configuration found for type: ${finalType}`);
    return;
  }
  
  console.log('\nConfiguration:');
  console.log(`  Skip rows: ${config.skipRows}`);
  console.log(`  Date column: ${config.columns.date}`);
  console.log(`  Description column: ${config.columns.description}`);
  console.log(`  Amount column: ${config.columns.amount || 'N/A'}`);
  console.log(`  Withdrawal column: ${config.columns.withdrawal || 'N/A'}`);
  console.log(`  Deposit column: ${config.columns.deposit || 'N/A'}`);
  
  // Count valid transactions
  let validCount = 0;
  const skipRows = config.skipRows || 0;
  
  for (let i = skipRows; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const dateStr = row[config.columns.date];
    if (!dateStr || dateStr.trim() === '') continue;
    
    // Check if has amount
    let hasAmount = false;
    if (config.columns.amount !== undefined) {
      const amountStr = row[config.columns.amount];
      if (amountStr && amountStr.toString().trim() !== '') {
        hasAmount = true;
      }
    } else if (config.columns.withdrawal !== undefined && config.columns.deposit !== undefined) {
      const withdrawalStr = row[config.columns.withdrawal];
      const depositStr = row[config.columns.deposit];
      if ((withdrawalStr && withdrawalStr.toString().trim() !== '') || 
          (depositStr && depositStr.toString().trim() !== '')) {
        hasAmount = true;
      }
    }
    
    if (hasAmount) {
      validCount++;
      if (validCount <= 3) {
        console.log(`  Valid row ${i}: date="${dateStr}", desc="${row[config.columns.description]}"`);
      }
    }
  }
  
  console.log(`\n${'*'.repeat(40)}`);
  console.log(`RESULT: Found ${validCount} valid transactions`);
  console.log(`${'*'.repeat(40)}`);
  
  return validCount;
}

// Main test
console.log('CSV Parser Test\n');

const testFiles = [];

// Find PayPay files
const dataDir2025 = './data/2025';
if (fs.existsSync(dataDir2025)) {
  const files = fs.readdirSync(dataDir2025);
  const paypayFiles = files.filter(f => f.includes('2156'));
  paypayFiles.forEach(f => testFiles.push(path.join(dataDir2025, f)));
}

// Find Orico/KAL files
const dataDir2024 = './data/2024';
if (fs.existsSync(dataDir2024)) {
  const files = fs.readdirSync(dataDir2024);
  const oricoFiles = files.filter(f => f.startsWith('KAL'));
  oricoFiles.forEach(f => testFiles.push(path.join(dataDir2024, f)));
}

// Find UFJ file for comparison
if (fs.existsSync(dataDir2024)) {
  const files = fs.readdirSync(dataDir2024);
  const ufjFiles = files.filter(f => f.match(/^\d{7}_/));
  ufjFiles.slice(0, 1).forEach(f => testFiles.push(path.join(dataDir2024, f)));
}

console.log(`Found ${testFiles.length} test files\n`);

let totalTransactions = 0;
const results = {};

testFiles.forEach(file => {
  const count = parseCSVFile(file);
  if (count !== undefined) {
    totalTransactions += count;
    const type = path.basename(file).includes('2156') ? 'PayPay' :
                 path.basename(file).startsWith('KAL') ? 'Orico' :
                 path.basename(file).match(/^\d{7}_/) ? 'UFJ' : 'Unknown';
    results[type] = (results[type] || 0) + count;
  }
});

console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log('Total transactions found:', totalTransactions);
console.log('By type:', results);
console.log('='.repeat(60));