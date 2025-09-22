# Household Account Book Application

A comprehensive financial management tool for tracking household expenses and income from multiple Japanese financial institutions.

## Features

- **Multi-Bank Support**: Parse CSV files from Orico, PayPay, UFJ Bank, JRE Bank, SMBC Bank
- **Smart Categorization**: Automatic transaction categorization with customizable mappings
- **Duplicate Detection**: Intelligent duplicate detection across multiple CSV files
- **Category Mapping Generation**: Extract and categorize all unique transaction descriptions
- **Data Visualization**: Monthly breakdown charts and category analysis
- **CSV Export**: Export processed transactions for external analysis

## Supported Categories

### Income Categories
- Salary
- Company Refund
- Country/Tax Refund
- Withdraw
- Other Income

### Expense Categories
- Investment
- Education
- Grocery
- Clothing/Wear
- Housing
- Utility Cost
- Medical Expenses
- Leisure/Entertainment
- Gift
- Others

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Then, open the page listed in console (probably http://localhost:5173/) in your browser.

## Usage

1. **Upload CSV Files**: Click "Upload CSV Files" to import bank statements
2. **Generate Category Mapping**: Click "Generate Category Mapping" to analyze and categorize all transactions
3. **View Transactions**: Browse transactions with monthly breakdowns
4. **View Statistics**: Analyze spending patterns with charts
5. **Export Data**: Download processed transactions as CSV

## Project Structure

```
├── src/                  # Source code
│   ├── components/       # React components
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript definitions
├── data/                # Configuration files (gitignored)
├── test-scripts/        # Test utilities (gitignored)
└── dist/               # Build output
```

## Configuration

Place your customized `categoryMapping.json` in the `data/` directory to override default categorizations.

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture information.
