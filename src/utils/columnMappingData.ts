// This file handles loading bankwise column mapping data
// Prioritizes data/ directory over sample_data/

import sampleBankwiseColumnMapping from '../../sample_data/bankwiseColumnMapping.json';
import dataBankwiseColumnMapping from '../../data/bankwiseColumnMapping.json';

// Use data mapping if it exists, otherwise fallback to sample
const columnMappingData = dataBankwiseColumnMapping || sampleBankwiseColumnMapping;

export { columnMappingData };