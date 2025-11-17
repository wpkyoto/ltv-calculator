# LTV calculator

SaaS metrics calculator for calculating the following properties:

- **LTV** (Lifetime Value)
- **MRR** / **ARR** (Monthly/Annual Recurring Revenue)
- **Churn Rate** (Customer & Revenue)
- **NRR** / **GRR** (Net/Gross Revenue Retention)
- **Cohort Retention**
- **ARPU** (Average Revenue Per User)
- **Average Duration**

SaaSビジネスに必要な各種指標を計算するライブラリです。Stripe等から取得したデータを元に、LTV・MRR・チャーンレート・NRR/GRR・コホート分析などを簡単に計算できます。

## Motivation blog post: 計算式参考

ユーザの平均継続期間が「1/解約率」で求められることの数学的証明:https://migi.hatenablog.com/entry/churn-formula

## API Docs
https://hideokamoto.github.io/ltv-calculator/

## Install
https://www.npmjs.com/package/ltv-calculator

```bash
$ npm i -S ltv-calculator
```

## Usage

### MRR (Monthly Recurring Revenue) / ARR (Annual Recurring Revenue)

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// MRRを計算
// Calculate MRR from subscriptions
const subscriptions = [
  { amount: 1000, interval: 'month' },  // 月次: 1000円
  { amount: 12000, interval: 'year' },  // 年次: 12000円/年 = 1000円/月
  { amount: 100, interval: 'week' }     // 週次: 100円/週
]
const mrr = client.calculateMRR(subscriptions)

// ARRを計算 (MRR × 12)
// Calculate ARR (MRR × 12)
const arr = client.calculateARR(subscriptions)
```

### Churn Rate (解約率)

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// 顧客ベースのチャーンレート
// Customer-based churn rate
const customerChurn = client.calculateCustomerChurnRate({
  startCustomers: 100,
  churnedCustomers: 5
}) // = 5%

// 収益ベースのチャーンレート（グロス）
// Revenue-based churn rate (Gross)
const revenueChurn = client.calculateRevenueChurnRate({
  startMRR: 10000,
  churnedMRR: 500,
  contractionMRR: 200  // ダウングレードによる減少
}) // = 7%
```

### NRR (Net Revenue Retention) / GRR (Gross Revenue Retention)

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// NRR: 既存顧客からの収益維持率（アップグレードを含む）
// NRR: Net Revenue Retention (includes expansion)
const nrr = client.calculateNRR({
  startMRR: 10000,
  expansionMRR: 1000,    // アップグレード
  contractionMRR: 200,   // ダウングレード
  churnedMRR: 300        // 解約
}) // = 105%

// GRR: 既存顧客からの収益維持率（アップグレードを除く）
// GRR: Gross Revenue Retention (excludes expansion)
const grr = client.calculateGRR({
  startMRR: 10000,
  contractionMRR: 200,
  churnedMRR: 300
}) // = 95%
```

### Cohort Retention (コホート分析)

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// コホート別のリテンション率を計算
// Calculate cohort retention rates
const retention = client.calculateCohortRetention([
  { month: 0, customers: 100 },
  { month: 1, customers: 90 },
  { month: 2, customers: 85 }
])
// = [100, 90, 85] (%)
```

### Historical LTV

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// 過去の顧客収益データから平均LTVを算出
// Calculate average LTV from historical customer revenues
const customerRevenues = [1000, 1200, 1500, 800, 2000]
const ltv = client.calculateHistoricalLTV(customerRevenues)
// = 1300 (average)
```

### ARPU

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// 売り上げが100単位・ユーザー数が10単位の時、ARPUは10単位
// Sales is 100 unit and user is 10, ARPU is 10 unit
const arpu = client.calcARPU(100, 10).getARPU()
expect(arpu).toEqual(10)

// ショートハンドル
// short handle
const arpu = client.getARPU(100, 10)
expect(arpu).toEqual(10)
```

## Average Duration / 解約率からの平均継続期間の計算

1 / churn rate (1 / 解約率) = Average Duration (平均継続期間)

```typescript
import LTVCalculator from 'ltv-calculator'
const client = new LTVCalculator()

// 解約率10%の時、平均継続期間は10単位 
// Churn rate is 10% -> Average duration is 10 unit
const averageDuration = client
  .calcAverageDurationByChurnRate(10)
  .getAverageDurationByChurnRate()
expect(averageDuration).toEqual(10)

// ショートハンドル版
const averageDuration = client
  .getAverageDurationByChurnRate(10)
expect(averageDuration).toEqual(10)

// 解約率10%の時、平均継続期間は10単位（単位を明示的に設定する）
// Churn rate is 10% -> Average duration is 10 unit
const averageDuration = client
  .calcAverageDurationByChurnRate(10, 'percentage')
  .getAverageDurationByChurnRate()
expect(averageDuration).toEqual(10)

// ショートハンドル版
const averageDuration = client
  .getAverageDurationByChurnRate(10, 'percentage')
expect(averageDuration).toEqual(10)

// 解約率0.1(10%)の時、平均継続期間は10単位（パーセントではなく数値でも指定できる）
// Churn rate is 0.1(10%) -> Average duration is 10 unit
const averageDuration = client
  .calcAverageDurationByChurnRate(0.1, 'number')
  .getAverageDurationByChurnRate()
expect(averageDuration).toEqual(10)

// ショートハンドル版
const averageDuration = client
  .getAverageDurationByChurnRate(0.1, 'number')
expect(averageDuration).toEqual(10)
```

## LTVの計算

平均継続期間 * ARPUで計算する。

```typescript
// 1: 売り上げが100単位・ユーザー数が10単位の時、ARPUは10単位
//    Sales is 100 unit and user is 10, ARPU is 10 unit
//
// 2: 解約率10%の時、平均継続期間は10単位 
//    Churn rate is 10% -> Average duration is 10 unit
//
// 3: LTV (平均継続期間 * ARPU)は 10 * 10 = 100単位
//    LTV (Average Duration * ARPU) is 10 * 10 = 100 unit
const arpu = client.calcARPU(100, 10)
    .calcAverageDurationByChurnRate(10)
    .getLTV()

expect(arpu).toEqual(100)
```

## contribution

```bash
// clone
$ git clone git@github.com:hideokamoto/ltv-calculator.git
$ cd ltv-calculator

// setup
$ yarn

// Unit test
$ yarn test
or
$ yarn run test:watch

// Lint
$ yarn run lint
or
$ yarn run lint --fix

// Build
$ yarn run build

// Rebuild docs
$ yarn run doc
```