# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Household Account Book application - a financial management tool that processes CSV files from credit cards, banks, and payment services to track household expenses and income. The application supports multiple Japanese financial institutions including Orico, KAL Bank, PayPay, UFJ Bank, JRE Bank, and SMBC Bank.

## Key Commands

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Testing

Add unit tests and integration tests for all the functions.

## Architecture Overview

### Core Data Flow

1. **CSV Upload** → User uploads CSV files through `FileUpload.tsx`
2. **Format Detection** → `csvParser.ts` identifies file type (Orico/KAL/PayPay/UFJ/JRE/SMBC/Generic)
3. **Data Parsing** → Format-specific parsing with Japanese encoding support
4. **Duplicate Detection** → `duplicateDetector.ts` identifies and merges duplicates using:
   - Amount matching (±0.01)
   - Date matching (same day)
   - Time proximity (5 minutes)
   - Description similarity (70% threshold)
5. **Display & Export** → `TransactionTable.tsx` shows data, `csvExporter.ts` handles exports

### Key Technical Decisions

**CSV Processing Strategy**: The application uses PapaParse for CSV parsing but implements custom logic for each financial institution's format. The parser handles:

- Japanese character encoding (Shift-JIS) using iconv-lite
- Multiple date formats including Japanese dates
- Various currency representations
- Transaction categorization based on merchant patterns
- Internal transfer filtering: Ignores bank-to-bank transfers between your own accounts, but keeps transaction fees

**State Management**: Simple React state with localStorage for persistence. No Redux or complex state management needed due to straightforward data flow.

**Authentication**: Basic localStorage-based authentication in `App.tsx`. Not intended for production security.

## Important File Locations

- **CSV Parsing Logic**: `src/utils/csvParser.ts` - Contains all format-specific parsing rules
- **Main Application State**: `src/components/Dashboard.tsx` - Manages transactions and file processing
- **Transaction Types**: `src/types/Transaction.ts` - TypeScript interfaces for data structures
- **Sample Data**: `data/` directory contains real CSV examples from each supported institution

## Development Considerations

When modifying CSV parsing:

- Test with files from `data/` directory
- Maintain backward compatibility with existing formats
- Handle Japanese text encoding properly
- Preserve duplicate detection logic accuracy
- duplicate detection should work versatile all input files.
- e.g. expense paypay in ufj file don't need to import because the detail of paypay expense is recorded in paypay csv files.
- use base csv parse function to make the code simple.
- In the final product, all possible csv file should be able to treat. So try to generalize functions.

When adding new financial institutions:

- Add detection logic in `detectFileType()` in csvParser.ts
- Implement format-specific parsing function
- Test with real CSV samples
- Update FileUpload component's accepted formats if needed

# Output

- All the pages should be as simple ad easy to understand as possible.
- Try to visualize to easy to understand the ouptut.
- category must be detail of transaction, e.g. salary, education, work, hobby, life etc.
- add the column which represents where is the source. e.g. UFJ (account number) transaction etc.
- sort the transaction by date time.
- ignore internal bank to bank (between my own accounts) transaction. but only record transaction fee for that.
