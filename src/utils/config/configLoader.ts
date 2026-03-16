import { columnMappingData } from './columnMappingData';
import defaultBaseCategories from '../../../config/baseCategories.json';
import depreciationUsefulLife from '../../../config/depreciationUsefulLife.json';
import { CategoryMapping } from '../../types/Category';
import { ColumnMapping } from '../../types/ColumnMapping';

const dataModules = import.meta.glob('../../../data/categoryMapping.json', { eager: true, import: 'default' });
const dataCategoryMapping = Object.values(dataModules)[0] as CategoryMapping | undefined;

const categoryMappingDefault: CategoryMapping = dataCategoryMapping || defaultBaseCategories as CategoryMapping;

// Depreciation useful life: nested structure from config
// Top-level keys are asset categories (建物, 建物附属設備, etc.)
// Values are either numbers or nested objects with sub-categories
export type UsefulLifeTable = Record<string, Record<string, number | Record<string, number>>>;

class ConfigLoader {
  private categoryMapping: CategoryMapping;
  private columnMapping: ColumnMapping;
  private depreciationTable: UsefulLifeTable;

  constructor() {
    this.categoryMapping = categoryMappingDefault as CategoryMapping;
    this.columnMapping = columnMappingData as ColumnMapping;
    this.depreciationTable = depreciationUsefulLife as UsefulLifeTable;
  }

  getCategoryMapping(): CategoryMapping {
    return this.categoryMapping;
  }

  getColumnMapping(): ColumnMapping {
    return this.columnMapping;
  }

  getDepreciationTable(): UsefulLifeTable {
    return this.depreciationTable;
  }

  saveColumnMapping(mapping: ColumnMapping) {
    this.columnMapping = mapping;
    localStorage.setItem('columnMapping', JSON.stringify(mapping));
  }
}

export const configLoader = new ConfigLoader();
