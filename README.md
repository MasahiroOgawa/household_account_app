# Household Account Book Application

A financial management tool that processes CSV files from Japanese financial institutions to track household expenses and income.

## Features

- **Multi-Bank Support**: Parse CSV files from Orico, PayPay, UFJ Bank, JRE Bank, SMBC Bank, KAL Bank
- **Smart Categorization**: Automatic transaction categorization with customizable subcategory mappings
- **Duplicate Detection**: Intelligent duplicate detection across multiple CSV files
- **Category Editor**: Edit and assign subcategories to merchants, with new merchants automatically surfaced
- **Data Visualization**: Pie charts for income/expense breakdown, monthly bar charts
- **CSV Export**: Year-split export and 確定申告 (tax return) export

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (recommended) or npm

### 1. Install dependencies

```bash
bun install
```

### 2. Set up configuration files

Create a `data/` directory and add two configuration files:

```bash
mkdir -p data
```

#### `data/bankwiseColumnMapping.json` (optional)

A default `config/bankwiseColumnMapping.json` is provided with support for Orico, PayPay, MUFG, JRE Bank, and SMBC. If you place your own version in `data/bankwiseColumnMapping.json`, it will override the default. This is useful for adding custom filename patterns (e.g., your account number) or new bank sources.

Key fields in each source:
- `filename`: Glob patterns to match CSV filenames
- `columns`: Column indices for date, description, amount, etc.
- `amountColumns`: Use `withdrawal`/`deposit` for banks with separate columns instead of a single `amount`
- `encoding`: `"shift-jis"` or `"utf-8"`
- `skipRows`: Number of header rows to skip
- `dateFormat`: Date format in the CSV (e.g., `"YYYY/M/D"`, `"YYYYMMDD"`, `"YYYY年MM月DD日"`)
- `internalTransferPatterns`: Descriptions matching these are filtered out (bank-to-bank transfers)
- `feePatterns`: Exception patterns — kept even if they match internal transfer patterns

#### `data/categoryMapping.json` (optional)

Defines categories, subcategories, and merchant-to-category mappings. A default `config/baseCategories.json` is provided with standard income/expense categories and Japanese 確定申告 subcategories. If you don't create this file, the app uses the default categories with an empty mappings section.

To customize, copy the default and add your merchant mappings:

```bash
cp config/baseCategories.json data/categoryMapping.json
```

Then use the Category Mapping Editor in the app to assign merchants to subcategories, and download the updated file.

Subcategories with `private-` prefix are for personal expenses; those without (e.g., `売上原価`, `旅費交通費`) are for business/確定申告 purposes.

### 3. Start the development server

```bash
bun run dev
```

Open the URL shown in the console (usually http://localhost:5173/) in your browser.

### 4. First-time workflow

1. **Upload CSV files** — Go to the Upload tab and select your bank/credit card CSV files
2. **Review transactions** — Check the transaction table; new merchants will be categorized as `other_expense` by default
3. **Categorize merchants** — Go to the Category Mapping tab, use "Other Expense Only" filter to find uncategorized merchants, assign proper subcategories
4. **Download mapping** — Click "Download" to save your updated `categoryMapping.json`, then replace `data/categoryMapping.json` with it
5. **Re-upload** — Upload the same CSVs again to see transactions with corrected categories
6. **View stats** — Check pie charts and monthly bar charts in the Stats tab

## Project Structure

```
├── config/               # Default config files (git-tracked)
│   ├── bankwiseColumnMapping.json
│   └── baseCategories.json
├── src/
│   ├── components/       # React components (Dashboard, TransactionTable, CategoryEditor, etc.)
│   ├── utils/
│   │   ├── parsing/      # CSV parsing, encoding detection, transaction building
│   │   ├── category/     # Category detection, colors, display, subcategory resolution
│   │   └── config/       # Config loader for bankwiseColumnMapping and categoryMapping
│   └── types/            # TypeScript type definitions
├── data/                 # Personal overrides and data (gitignored)
└── dist/                 # Build output
```

## Development

```bash
bun run build      # Build for production
bun run lint       # Run linting
bun run test       # Run tests
bun run preview    # Preview production build
```

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture information.
