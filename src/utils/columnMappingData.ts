// This file handles loading bankwise column mapping data
// Prioritizes data/ directory over sample_data/

// Function to check if file exists and load it
function tryLoadJson(primaryPath: string, fallbackPath: string): any {
  try {
    // First try to load from primary path (data directory)
    return require(primaryPath);
  } catch (e) {
    try {
      // If primary fails, load from fallback (sample_data)
      console.warn(`Loading from fallback: ${fallbackPath}`);
      return require(fallbackPath);
    } catch (e2) {
      throw new Error(`Could not load config from ${primaryPath} or ${fallbackPath}`);
    }
  }
}

// Load column mapping - prioritize data/ over sample_data/
const columnMappingData = tryLoadJson(
  '../../data/bankwiseColumnMapping.json',
  '../../sample_data/bankwiseColumnMapping.json'
);

export { columnMappingData };