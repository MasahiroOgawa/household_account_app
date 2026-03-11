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
    this.categoryMapping = categoryMappingDefault as CategoryMapping;
    this.columnMapping = columnMappingData as ColumnMapping;
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
