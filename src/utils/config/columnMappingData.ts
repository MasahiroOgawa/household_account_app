import defaultBankwiseColumnMapping from '../../../config/bankwiseColumnMapping.json';

const dataModules = import.meta.glob('../../../data/bankwiseColumnMapping.json', { eager: true, import: 'default' });
const dataBankwiseColumnMapping = Object.values(dataModules)[0] as typeof defaultBankwiseColumnMapping | undefined;

const columnMappingData = dataBankwiseColumnMapping || defaultBankwiseColumnMapping;

export { columnMappingData };
