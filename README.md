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

#### `data/categoryMapping.json`

Defines categories, subcategories, and merchant-to-category mappings. You can start with an empty one and build it up using the app:

```json
{
  "categories": {
    "income": ["salary", "revenue", "company_refund", "tax_refund", "withdraw", "other_income"],
    "expense": ["invest", "education", "grocery", "housing", "medical", "tax", "insurance", "transit", "wear", "leisure", "gift", "fee", "other_expense"]
  },
  "subcategories": {
    "income": {
      "private-salary": "salary",
      "private-revenue": "revenue",
      "private-company_refund": "company_refund",
      "private-tax_refund": "tax_refund",
      "private-withdraw": "withdraw",
      "private-other_income": "other_income"
    },
    "expense": {
      "売上原価": "invest",
      "租税公課": "tax",
      "旅費交通費": "transit",
      "保険料": "insurance",
      "接待交際費": "grocery",
      "支払手数料": "fee",
      "private-invest": "invest",
      "private-education": "education",
      "private-grocery": "grocery",
      "private-housing": "housing",
      "private-medical": "medical",
      "private-tax": "tax",
      "private-insurance": "insurance",
      "private-transit": "transit",
      "private-wear": "wear",
      "private-leisure": "leisure",
      "private-gift": "gift",
      "private-fee": "fee",
      "private-other_expense": "other_expense"
    }
  },
  "mappings": {}
}
```

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
│   └── bankwiseColumnMapping.json
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
