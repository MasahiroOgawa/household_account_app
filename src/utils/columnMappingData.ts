// This file handles loading bankwise column mapping data
// Falls back to sample data if the main file is missing

import sampleBankwiseColumnMapping from '../../sample_data/bankwiseColumnMapping.json';

// Try to load from data directory, fallback to sample
let columnMappingData: any;

try {
  // Attempt to load from data directory (this might fail at build time if file doesn't exist)
  columnMappingData = require('../../data/bankwiseColumnMapping.json');
} catch (error) {
  console.warn('Using sample bankwise column mapping as data file is not available');
  columnMappingData = sampleBankwiseColumnMapping;
}

export { columnMappingData };