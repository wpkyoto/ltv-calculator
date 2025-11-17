import { beforeEach, describe, expect, it } from 'vitest'
import {
  type CohortDataPoint,
  type CustomerChurnInput,
  LTVCalculator,
  type NRRInput,
  type RevenueChurnInput,
  type Subscription,
} from '../libs/index'

describe('LTVCalculator', () => {
  let client = new LTVCalculator()
  describe('LTV', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('If Sales is 100, User is 10, and Churn rate is 10%. The LTV is 100', () => {
      const arpu = client.calcARPU(100, 10).calcAverageDurationByChurnRate(10).getLTV()
      expect(arpu).toEqual(100)
    })
  })
  describe('ARPU', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('If Sales is 100 and User number is 10, the ARPU should be 10', () => {
      const arpu = client.calcARPU(100, 10).getARPU()
      expect(arpu).toEqual(10)
    })
    it('If Sales is 100 and User number is 10, the ARPU should be 10', () => {
      const arpu = client.getARPU(100, 10)
      expect(arpu).toEqual(10)
    })
  })
  describe('Average Duration', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('If churn rate is 10%, The average duration should be 10', () => {
      const averageDuration = client
        .calcAverageDurationByChurnRate(10)
        .getAverageDurationByChurnRate()
      expect(averageDuration).toEqual(10)
    })
    it('If churn rate is 10%, The average duration should be 10', () => {
      const averageDuration = client
        .calcAverageDurationByChurnRate(10, 'percentage')
        .getAverageDurationByChurnRate()
      expect(averageDuration).toEqual(10)
    })
    it('If churn rate is 0.1, The average duration should be 10', () => {
      const averageDuration = client
        .calcAverageDurationByChurnRate(0.1, 'number')
        .getAverageDurationByChurnRate()
      expect(averageDuration).toEqual(10)
    })
    it('If churn rate is 10%, The average duration should be 10', () => {
      const averageDuration = client.getAverageDurationByChurnRate(10)
      expect(averageDuration).toEqual(10)
    })
    it('If churn rate is 10%, The average duration should be 10', () => {
      const averageDuration = client.getAverageDurationByChurnRate(10, 'percentage')
      expect(averageDuration).toEqual(10)
    })
    it('If churn rate is 0.1, The average duration should be 10', () => {
      const averageDuration = client.getAverageDurationByChurnRate(0.1, 'number')
      expect(averageDuration).toEqual(10)
    })
  })
  describe('MRR/ARR', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('Should calculate MRR correctly for monthly subscriptions', () => {
      const subscriptions: Subscription[] = [
        { amount: 1000, interval: 'month' },
        { amount: 2000, interval: 'month' },
      ]
      const mrr = client.calculateMRR(subscriptions)
      expect(mrr).toEqual(3000)
    })
    it('Should calculate MRR correctly for yearly subscriptions', () => {
      const subscriptions: Subscription[] = [{ amount: 12000, interval: 'year' }]
      const mrr = client.calculateMRR(subscriptions)
      expect(mrr).toEqual(1000)
    })
    it('Should calculate MRR correctly for mixed intervals', () => {
      const subscriptions: Subscription[] = [
        { amount: 1000, interval: 'month' },
        { amount: 12000, interval: 'year' },
        { amount: 52, interval: 'week' },
      ]
      const mrr = client.calculateMRR(subscriptions)
      // 1000 + 1000 + (52 * 52 / 12) = 2225.33...
      expect(mrr).toBeCloseTo(2225.33, 1)
    })
    it('Should calculate ARR correctly', () => {
      const subscriptions: Subscription[] = [{ amount: 1000, interval: 'month' }]
      const arr = client.calculateARR(subscriptions)
      expect(arr).toEqual(12000)
    })
  })
  describe('Churn Rate', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('Should calculate customer churn rate correctly', () => {
      const input: CustomerChurnInput = {
        startCustomers: 100,
        churnedCustomers: 5,
      }
      const churnRate = client.calculateCustomerChurnRate(input)
      expect(churnRate).toEqual(5)
    })
    it('Should return 0 when startCustomers is 0', () => {
      const input: CustomerChurnInput = {
        startCustomers: 0,
        churnedCustomers: 5,
      }
      const churnRate = client.calculateCustomerChurnRate(input)
      expect(churnRate).toEqual(0)
    })
    it('Should calculate revenue churn rate correctly', () => {
      const input: RevenueChurnInput = {
        startMRR: 10000,
        churnedMRR: 500,
        contractionMRR: 200,
      }
      const churnRate = client.calculateRevenueChurnRate(input)
      expect(churnRate).toBeCloseTo(7, 10)
    })
    it('Should calculate revenue churn rate without contractionMRR', () => {
      const input: RevenueChurnInput = {
        startMRR: 10000,
        churnedMRR: 500,
      }
      const churnRate = client.calculateRevenueChurnRate(input)
      expect(churnRate).toEqual(5)
    })
  })
  describe('NRR/GRR', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('Should calculate NRR correctly', () => {
      const input: NRRInput = {
        startMRR: 10000,
        expansionMRR: 1000,
        contractionMRR: 200,
        churnedMRR: 300,
      }
      const nrr = client.calculateNRR(input)
      expect(nrr).toEqual(105)
    })
    it('Should calculate NRR without optional fields', () => {
      const input: NRRInput = {
        startMRR: 10000,
        churnedMRR: 300,
      }
      const nrr = client.calculateNRR(input)
      expect(nrr).toEqual(97)
    })
    it('Should calculate GRR correctly', () => {
      const input: NRRInput = {
        startMRR: 10000,
        contractionMRR: 200,
        churnedMRR: 300,
      }
      const grr = client.calculateGRR(input)
      expect(grr).toEqual(95)
    })
    it('Should return 0 when startMRR is 0', () => {
      const input: NRRInput = {
        startMRR: 0,
        churnedMRR: 300,
      }
      const nrr = client.calculateNRR(input)
      const grr = client.calculateGRR(input)
      expect(nrr).toEqual(0)
      expect(grr).toEqual(0)
    })
  })
  describe('Cohort Retention', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('Should calculate cohort retention correctly', () => {
      const cohorts: CohortDataPoint[] = [
        { month: 0, customers: 100 },
        { month: 1, customers: 90 },
        { month: 2, customers: 85 },
      ]
      const retention = client.calculateCohortRetention(cohorts)
      expect(retention).toEqual([100, 90, 85])
    })
    it('Should handle unsorted cohort data', () => {
      const cohorts: CohortDataPoint[] = [
        { month: 2, customers: 85 },
        { month: 0, customers: 100 },
        { month: 1, customers: 90 },
      ]
      const retention = client.calculateCohortRetention(cohorts)
      expect(retention).toEqual([100, 90, 85])
    })
    it('Should return empty array for empty input', () => {
      const retention = client.calculateCohortRetention([])
      expect(retention).toEqual([])
    })
    it('Should return 0s when base customers is 0', () => {
      const cohorts: CohortDataPoint[] = [
        { month: 0, customers: 0 },
        { month: 1, customers: 0 },
      ]
      const retention = client.calculateCohortRetention(cohorts)
      expect(retention).toEqual([0, 0])
    })
  })
  describe('Historical LTV', () => {
    beforeEach(() => {
      client = new LTVCalculator()
    })
    it('Should calculate historical LTV correctly', () => {
      const revenues = [1000, 1200, 1500, 800, 2000]
      const ltv = client.calculateHistoricalLTV(revenues)
      expect(ltv).toEqual(1300)
    })
    it('Should return 0 for empty array', () => {
      const ltv = client.calculateHistoricalLTV([])
      expect(ltv).toEqual(0)
    })
    it('Should handle single customer', () => {
      const revenues = [1000]
      const ltv = client.calculateHistoricalLTV(revenues)
      expect(ltv).toEqual(1000)
    })
  })
})
