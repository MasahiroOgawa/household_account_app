# Category Mapping Summary

## New Categories (6 total)

### 1. Kids 👶
- **Definition**: Bank transfers to other individuals (excluding own accounts and business transactions)
- **Detection**: Bank transfers that are NOT to:
  - Own accounts
  - Credit card companies
  - Investment/securities firms
  - Insurance companies
  - Utilities/services
  - E-money services
  - Educational institutions

### 2. Food 🍽️
- **Includes**:
  - Supermarkets (イオン, マルエツ, サミット, etc.)
  - Convenience stores (セブンイレブン, ローソン, ファミリーマート)
  - Restaurants (マクドナルド, スターバックス, ガスト, etc.)
  - Food delivery (Uber Eats, 出前館)
  - All dining and grocery expenses
- **Old Categories Mapped**: Groceries, Dining, Food

### 3. Housing 🏠
- **Includes**:
  - Rent (家賃, 管理費, 共益費)
  - Utilities (電気, ガス, 水道)
  - Internet/Phone services
  - Home maintenance and repairs
- **Old Categories Mapped**: Utilities, Rent, Housing

### 4. Education 📚
- **Includes**:
  - School fees (学費, 授業料)
  - Universities (早稲田, 慶応, etc.)
  - Cram schools (塾, 予備校, 公文)
  - Lessons (ピアノ, 英会話, スイミング)
  - Educational materials
- **Old Categories Mapped**: Education

### 5. Leisure 🎮
- **Includes**:
  - Entertainment (映画, ゲーム, カラオケ)
  - Travel (ホテル, 旅行, 交通)
  - Sports and fitness (ジム, ゴルフ, テニス)
  - Hobbies (書店, 音楽, Netflix)
  - Fashion/Shopping (ユニクロ, MUJI)
  - Beauty services (美容院, エステ)
- **Old Categories Mapped**: Hobby, Entertainment, Travel, Shopping, Online Shopping

### 6. Others 📊
- **Includes all remaining categories**:
  - ATM transactions
  - Bank fees
  - Credit card payments
  - Insurance
  - Investments
  - Salary (income)
  - Tax payments
  - Healthcare
- **Old Categories Mapped**: Other, Life, Bank Transfer (business), Bank Fee, Credit Card, ATM, E-Money Transfer, Healthcare, Insurance, Investment, Salary, Tax

## Key Mapping Logic

1. **Priority Order**: 
   - First checks for kids (personal bank transfers)
   - Then matches by keywords and old categories
   - Defaults to "others" if no match

2. **Special Cases**:
   - Bank transfers are analyzed to distinguish between personal (kids) and business (others)
   - E-money charges (PayPay, etc.) go to "others" not "kids"
   - Investment transfers go to "others" not "kids"

3. **Color Scheme**:
   - Kids: Red (#FF6B6B)
   - Food: Teal (#4ECDC4)
   - Housing: Blue (#45B7D1)
   - Education: Green (#96CEB4)
   - Leisure: Yellow (#FFEAA7)
   - Others: Gray (#A8A8A8)