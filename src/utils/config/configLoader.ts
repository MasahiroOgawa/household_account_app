import { columnMappingData } from './columnMappingData';
import { CategoryMapping } from '../../types/Category';
import { ColumnMapping } from '../../types/ColumnMapping';

const dataModules = import.meta.glob('../../../data/categoryMapping.json', { eager: true, import: 'default' });
const dataCategoryMapping = Object.values(dataModules)[0] as CategoryMapping | undefined;

const categoryMappingDefault: CategoryMapping = dataCategoryMapping || { categories: { income: [], expense: [] }, subcategories: { income: {}, expense: {} }, mappings: {} };

class ConfigLoader {
  private categoryMapping: CategoryMapping;
  private columnMapping: ColumnMapping;

  constructor() {
    this.categoryMapping = categoryMappingDefault as CategoryMapping;
    this.columnMapping = columnMappingData as ColumnMapping;
  }

  getCategoryMapping(): CategoryMapping {
    return this.categoryMapping;
  }

  getColumnMapping(): ColumnMapping {
    return this.columnMapping;
  }

  saveColumnMapping(mapping: ColumnMapping) {
    this.columnMapping = mapping;
    localStorage.setItem('columnMapping', JSON.stringify(mapping));
  }
}

export const configLoader = new ConfigLoader();
