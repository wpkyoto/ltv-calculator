export type NumberType = 'percentage' | 'number'

/**
 * Subscription interval type
 */
export type SubscriptionInterval = 'month' | 'year' | 'week' | 'day'

/**
 * Subscription data for MRR calculation
 */
export interface Subscription {
  amount: number
  interval: SubscriptionInterval
}

/**
 * Customer churn rate calculation input
 */
export interface CustomerChurnInput {
  startCustomers: number
  churnedCustomers: number
}

/**
 * Revenue churn rate calculation input
 */
export interface RevenueChurnInput {
  startMRR: number
  churnedMRR: number
  contractionMRR?: number
}

/**
 * NRR (Net Revenue Retention) calculation input
 */
export interface NRRInput {
  startMRR: number
  newMRR?: number
  expansionMRR?: number
  contractionMRR?: number
  churnedMRR: number
}

/**
 * Cohort data point
 */
export interface CohortDataPoint {
  month: number
  customers: number
}

// Subscription interval conversion constants
const MONTHS_PER_YEAR = 12
const WEEKS_PER_YEAR = 52
const DAYS_PER_YEAR = 365

/**
 * Calculate ARPU (Average Revenue Per User)
 * @param {number} sales - Total sales/revenue
 * @param {number} users - Number of users
 * @returns {number} ARPU
 */
export function calculateARPU(sales: number, users: number): number {
  return sales / users
}

/**
 * Calculate average customer duration from churn rate
 * @param {number} churnRate - Churn rate (percentage by default, or decimal number)
 * @param {NumberType} type - 'percentage' or 'number' (default: 'percentage')
 * @returns {number} Average duration. Returns `Infinity` if `churnRate` is 0.
 */
export function calculateAverageDuration(
  churnRate: number,
  type: NumberType = 'percentage'
): number {
  return type === 'percentage' ? 1 / (churnRate / 100) : 1 / churnRate
}

/**
 * Calculate LTV (Lifetime Value)
 * @param {number} arpu - Average Revenue Per User
 * @param {number} averageDuration - Average customer duration
 * @returns {number} LTV
 */
export function calculateLTV(arpu: number, averageDuration: number): number {
  return arpu * averageDuration
}

/**
 * Calculate MRR (Monthly Recurring Revenue)
 * @param {Subscription[]} subscriptions - Array of subscriptions
 * @returns {number} MRR
 */
export function calculateMRR(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    const { amount, interval } = sub
    switch (interval) {
      case 'month':
        return total + amount
      case 'year':
        return total + amount / MONTHS_PER_YEAR
      case 'week':
        return total + (amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR
      case 'day':
        return total + (amount * DAYS_PER_YEAR) / MONTHS_PER_YEAR
      default:
        return total
    }
  }, 0)
}

/**
 * Calculate ARR (Annual Recurring Revenue)
 * @param {Subscription[]} subscriptions - Array of subscriptions
 * @returns {number} ARR
 */
export function calculateARR(subscriptions: Subscription[]): number {
  return calculateMRR(subscriptions) * MONTHS_PER_YEAR
}

/**
 * Calculate customer-based churn rate
 * @param {CustomerChurnInput} input - Customer churn calculation input
 * @returns {number} Churn rate (%)
 */
export function calculateCustomerChurnRate(input: CustomerChurnInput): number {
  const { startCustomers, churnedCustomers } = input
  if (startCustomers === 0) return 0
  return (churnedCustomers / startCustomers) * 100
}

/**
 * Calculate revenue-based churn rate (Gross)
 * @param {RevenueChurnInput} input - Revenue churn calculation input
 * @returns {number} Gross revenue churn rate (%)
 */
export function calculateRevenueChurnRate(input: RevenueChurnInput): number {
  const { startMRR, churnedMRR, contractionMRR = 0 } = input
  if (startMRR === 0) return 0
  return ((churnedMRR + contractionMRR) / startMRR) * 100
}

/**
 * Calculate NRR (Net Revenue Retention)
 * @param {NRRInput} input - NRR calculation input
 * @returns {number} NRR (%)
 */
export function calculateNRR(input: NRRInput): number {
  const { startMRR, expansionMRR = 0, contractionMRR = 0, churnedMRR } = input
  if (startMRR === 0) return 0
  const endMRR = startMRR + expansionMRR - contractionMRR - churnedMRR
  return (endMRR / startMRR) * 100
}

/**
 * Calculate GRR (Gross Revenue Retention)
 * @param {NRRInput} input - GRR calculation input
 * @returns {number} GRR (%)
 */
export function calculateGRR(input: NRRInput): number {
  const { startMRR, contractionMRR = 0, churnedMRR } = input
  if (startMRR === 0) return 0
  const retainedMRR = startMRR - contractionMRR - churnedMRR
  return (retainedMRR / startMRR) * 100
}

/**
 * Calculate cohort retention rates
 * @param {CohortDataPoint[]} cohorts - Array of cohort data points
 * @returns {number[]} Array of retention rates (%)
 */
export function calculateCohortRetention(cohorts: CohortDataPoint[]): number[] {
  if (cohorts.length === 0) return []

  const sortedCohorts = [...cohorts].sort((a, b) => a.month - b.month)
  const baseCustomers = sortedCohorts[0].customers

  if (baseCustomers === 0) return sortedCohorts.map(() => 0)

  return sortedCohorts.map((cohort) => (cohort.customers / baseCustomers) * 100)
}

/**
 * Calculate historical LTV from customer revenue data
 * @param {number[]} customerRevenues - Array of cumulative customer revenues
 * @returns {number} Average LTV
 */
export function calculateHistoricalLTV(customerRevenues: number[]): number {
  if (customerRevenues.length === 0) return 0
  const total = customerRevenues.reduce((sum, revenue) => sum + revenue, 0)
  return total / customerRevenues.length
}
