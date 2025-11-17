export type NumberType = 'percentage' | 'number'

/**
 * Subscription interval type
 */
export type SubscriptionInterval = 'month' | 'year' | 'week' | 'day'

/**
 * Subscription data for MRR calculation
 */
export interface Subscription {
  amount: number;
  interval: SubscriptionInterval;
}

/**
 * Customer churn rate calculation input
 */
export interface CustomerChurnInput {
  startCustomers: number;
  churnedCustomers: number;
}

/**
 * Revenue churn rate calculation input
 */
export interface RevenueChurnInput {
  startMRR: number;
  churnedMRR: number;
  contractionMRR?: number;
}

/**
 * NRR (Net Revenue Retention) calculation input
 */
export interface NRRInput {
  startMRR: number;
  newMRR?: number;
  expansionMRR?: number;
  contractionMRR?: number;
  churnedMRR: number;
}

/**
 * Cohort data point
 */
export interface CohortDataPoint {
  month: number;
  customers: number;
}

export class LTVCalculator {
  // パーセントか実数かのデフォルト設定
  private readonly defaultNumberType: NumberType = 'percentage'

  // 平均継続期間
  private averageDuration = 0

  // ARPU (Average Revenue Per User)
  private arpu = 0

  // LTV
  private ltv = 0

  // Churn rate
  private churnRate = 0

  /**
   * ARPUを計算する
   * @param {number} arpu
   */
  public setARPU (arpu: number): this {
    this.arpu = arpu
    return this
  }

  /**
   * ARPUを計算する
   * 値を取得したい場合はgetARPU()を使用する
   *
   * @param {number} sales 売り上げ
   * @param {number} user ユーザー数
   */
  public calcARPU (sales: number, user: number): this {
    const arpu = sales / user
    this.setARPU(arpu)
    return this
  }

  /**
   * ARPUを取得する
   * 引数を渡せば計算した結果を渡す
   *
   * @param [number] sales 売り上げ
   * @param [number] user ユーザー数
   */
  public getARPU (sales?: number, user?: number) {
    if (sales && user) this.calcARPU(sales, user)
    return this.arpu
  }

  /**
   * 解約率をセットする
   * @param {number} rate
   */
  public setChurnRate (rate: number): this {
    this.churnRate = rate
    return this
  }

  /**
   * 解約率を取得する
   */
  public getChurnRate (): number {
    return this.churnRate
  }

  /**
   * 解約率から平均継続期間を計算する
   *
   * @param {number} churnRate
   */
  public calcAverageDurationByChurnRate (churnRate?: number, type: NumberType = this.defaultNumberType): this {
    const rate = churnRate || this.churnRate
    this.averageDuration = type === 'percentage' ? 1 / (rate / 100) : 1 / rate
    return this
  }

  /**
   * 平均継続期間を取得する
   * 1 / (churn rate(%) * 100)
   */
  public getAverageDurationByChurnRate (churnRate?: number, type?: NumberType): number {
    if (churnRate) this.calcAverageDurationByChurnRate(churnRate, type)
    return this.averageDuration
  }

  /**
   * 平均継続期間をセットする
   * @param {number} duration
   */
  public setAverageDuration (duration: number): this {
    this.averageDuration = duration
    return this
  }

  /**
   * LTVを計算する
   */
  public calcLTV (averageDuration?: number, arpu?: number): this {
    this.ltv = (averageDuration || this.averageDuration) * (arpu || this.arpu)
    return this
  }

  /**
   * LTVを取得する
   * Average duration * ARPU = LTV
   */
  public getLTV (averageDuration?: number, arpu?: number): number {
    this.calcLTV(averageDuration, arpu)
    return this.ltv
  }

  /**
   * MRR (Monthly Recurring Revenue) を計算する
   * サブスクリプションの配列から月次経常収益を算出
   *
   * @param {Subscription[]} subscriptions - サブスクリプションの配列
   * @returns {number} MRR
   */
  public calculateMRR (subscriptions: Subscription[]): number {
    return subscriptions.reduce((total, sub) => {
      const { amount, interval } = sub
      switch (interval) {
        case 'month':
          return total + amount
        case 'year':
          return total + (amount / 12)
        case 'week':
          return total + (amount * 52 / 12)
        case 'day':
          return total + (amount * 365 / 12)
        default:
          return total
      }
    }, 0)
  }

  /**
   * ARR (Annual Recurring Revenue) を計算する
   * MRRの12倍
   *
   * @param {Subscription[]} subscriptions - サブスクリプションの配列
   * @returns {number} ARR
   */
  public calculateARR (subscriptions: Subscription[]): number {
    return this.calculateMRR(subscriptions) * 12
  }

  /**
   * 顧客ベースのチャーンレートを計算する
   * (解約顧客数 / 期初顧客数) * 100
   *
   * @param {CustomerChurnInput} input - 顧客チャーン計算の入力
   * @returns {number} チャーンレート (%)
   */
  public calculateCustomerChurnRate (input: CustomerChurnInput): number {
    const { startCustomers, churnedCustomers } = input
    if (startCustomers === 0) return 0
    return (churnedCustomers / startCustomers) * 100
  }

  /**
   * 収益ベースのチャーンレートを計算する (Gross)
   * ((解約MRR + ダウングレードMRR) / 期初MRR) * 100
   *
   * @param {RevenueChurnInput} input - 収益チャーン計算の入力
   * @returns {number} グロス収益チャーンレート (%)
   */
  public calculateRevenueChurnRate (input: RevenueChurnInput): number {
    const { startMRR, churnedMRR, contractionMRR = 0 } = input
    if (startMRR === 0) return 0
    return ((churnedMRR + contractionMRR) / startMRR) * 100
  }

  /**
   * NRR (Net Revenue Retention) を計算する
   * ((期初MRR + 拡張MRR - 縮小MRR - 解約MRR) / 期初MRR) * 100
   * 新規顧客のMRRは含まない
   *
   * @param {NRRInput} input - NRR計算の入力
   * @returns {number} NRR (%)
   */
  public calculateNRR (input: NRRInput): number {
    const { startMRR, expansionMRR = 0, contractionMRR = 0, churnedMRR } = input
    if (startMRR === 0) return 0
    const endMRR = startMRR + expansionMRR - contractionMRR - churnedMRR
    return (endMRR / startMRR) * 100
  }

  /**
   * GRR (Gross Revenue Retention) を計算する
   * ((期初MRR - 縮小MRR - 解約MRR) / 期初MRR) * 100
   * 拡張MRRは含まない
   *
   * @param {NRRInput} input - GRR計算の入力
   * @returns {number} GRR (%)
   */
  public calculateGRR (input: NRRInput): number {
    const { startMRR, contractionMRR = 0, churnedMRR } = input
    if (startMRR === 0) return 0
    const retainedMRR = startMRR - contractionMRR - churnedMRR
    return (retainedMRR / startMRR) * 100
  }

  /**
   * コホート別のリテンションレートを計算する
   * 各月のリテンションレート（%）を配列で返す
   *
   * @param {CohortDataPoint[]} cohorts - コホートデータの配列（月次の顧客数）
   * @returns {number[]} 各月のリテンションレート (%)
   */
  public calculateCohortRetention (cohorts: CohortDataPoint[]): number[] {
    if (cohorts.length === 0) return []

    // month順でソート
    const sortedCohorts = [...cohorts].sort((a, b) => a.month - b.month)
    const baseCustomers = sortedCohorts[0].customers

    if (baseCustomers === 0) return sortedCohorts.map(() => 0)

    return sortedCohorts.map(cohort => (cohort.customers / baseCustomers) * 100)
  }

  /**
   * Historical LTVを計算する
   * 過去の顧客収益データから平均LTVを算出
   *
   * @param {number[]} customerRevenues - 各顧客の累積収益の配列
   * @returns {number} 平均LTV
   */
  public calculateHistoricalLTV (customerRevenues: number[]): number {
    if (customerRevenues.length === 0) return 0
    const total = customerRevenues.reduce((sum, revenue) => sum + revenue, 0)
    return total / customerRevenues.length
  }
}
export default LTVCalculator
