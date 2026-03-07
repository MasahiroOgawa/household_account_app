import { columnMappingData } from './columnMappingData';
import sampleCategoryMapping from '../../../sample_data/categoryMapping.json';
import dataCategoryMapping from '../../../data/categoryMapping.json';
import { CategoryMapping } from '../../types/Category';
import { ColumnMapping } from '../../types/ColumnMapping';

const categoryMappingDefault = dataCategoryMapping || sampleCategoryMapping;

class ConfigLoader {
  private categoryMapping: CategoryMapping;
  private columnMapping: ColumnMapping;

  constructor() {
    const storedCategory = localStorage.getItem('categoryMapping');
    this.categoryMapping = storedCategory
      ? JSON.parse(storedCategory)
      : (categoryMappingDefault as CategoryMapping);
    const storedColumn = localStorage.getItem('columnMapping');
    this.columnMapping = storedColumn
      ? JSON.parse(storedColumn)
      : (columnMappingData as ColumnMapping);
  }

  getCategoryMapping(): CategoryMapping {
    return this.categoryMapping;
  }

  getColumnMapping(): ColumnMapping {
    return this.columnMapping;
  }

  saveCategoryMapping(mapping: CategoryMapping) {
    this.categoryMapping = mapping;
    localStorage.setItem('categoryMapping', JSON.stringify(mapping));
  }

  saveColumnMapping(mapping: ColumnMapping) {
    this.columnMapping = mapping;
    localStorage.setItem('columnMapping', JSON.stringify(mapping));
  }
}

export const configLoader = new ConfigLoader();
