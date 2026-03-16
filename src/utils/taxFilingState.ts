import { WithholdingTaxData } from './withholdingTaxPdfParser';
import { FurusatoDonation } from './furusatoTaxPdfParser';

export interface TaxFilingState {
  withholding: WithholdingTaxData | null;
  furusatoDonations: FurusatoDonation[];
  businessSources: string[]; // source names treated as business bank accounts
}

const STORAGE_KEY = 'tax_filing_state';

const defaultState: TaxFilingState = {
  withholding: null,
  furusatoDonations: [],
  businessSources: [],
};

export const loadTaxFilingState = (): TaxFilingState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    return { ...defaultState, ...JSON.parse(stored) };
  } catch {
    return defaultState;
  }
};

export const saveTaxFilingState = (state: TaxFilingState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
