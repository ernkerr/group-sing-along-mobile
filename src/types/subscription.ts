export enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus',
  PARTY = 'party',
  EVENT = 'event'  // 24-hour pass
}

export enum SubscriptionPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONCE = '24h'
}

export interface SubscriptionStatus {
  tier: SubscriptionTier
  period?: SubscriptionPeriod
  expiryDate?: string  // ISO date string
  isActive: boolean
}

export interface PricingTier {
  tier: SubscriptionTier
  name: string
  emoji: string
  memberLimit: number
  monthlyPrice?: number
  yearlyPrice?: number
  valueStatement: string
  features: string[]
  isPopular?: boolean
}

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 3,
  [SubscriptionTier.PLUS]: 10,
  [SubscriptionTier.PARTY]: 25,
  [SubscriptionTier.EVENT]: 25
}

export const TIER_PRICES = {
  [SubscriptionTier.PLUS]: {
    monthly: { price: 1.99, sku: 'groupsingalong_plus_ios_monthly' },
    yearly: { price: 20, sku: 'groupsingalong_plus_ios_yearly' }
  },
  [SubscriptionTier.PARTY]: {
    monthly: { price: 5.99, sku: 'groupsingalong_party_ios_monthly' },
    yearly: { price: 60, sku: 'groupsingalong_party_ios_yearly' }
  },
  [SubscriptionTier.EVENT]: {
    once: { price: 3.99, sku: 'groupsingalong_event_ios_24h' }
  }
}

export const PRICING_TIERS: PricingTier[] = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    emoji: '🆓',
    memberLimit: 3,
    valueStatement: 'Perfect for trying it out',
    features: [
      'Up to 3 people',
      'Host controls lyrics',
      'Real-time sync',
      'No account required'
    ]
  },
  {
    tier: SubscriptionTier.PLUS,
    name: 'Plus',
    emoji: '🎶',
    memberLimit: 10,
    monthlyPrice: 1.99,
    yearlyPrice: 20,
    valueStatement: 'For small groups who want it to just work.',
    features: [
      'Up to 10 people',
      'Unlimited songs',
      'Everyone stays on the same line',
      'Cancel anytime'
    ],
    isPopular: true
  },
  {
    tier: SubscriptionTier.PARTY,
    name: 'Party',
    emoji: '🎉',
    memberLimit: 25,
    monthlyPrice: 5.99,
    yearlyPrice: 60,
    valueStatement: 'For holidays, parties, and family gatherings.',
    features: [
      'Up to 25 people',
      'Faster sync for bigger groups',
      'Designed for group events',
      'One host, zero confusion'
    ]
  }
]

/**
 * Calculate subscription expiry date based on period
 */
export function calculateExpiry(period: SubscriptionPeriod): Date {
  const now = new Date()

  if (period === SubscriptionPeriod.MONTHLY) {
    // Renew on same day next month
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // If day doesn't exist (e.g., Jan 31 → Feb 31), use 1st of following month
    if (nextMonth.getDate() !== now.getDate()) {
      nextMonth.setDate(1)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
    }
    return nextMonth
  } else if (period === SubscriptionPeriod.YEARLY) {
    const nextYear = new Date(now)
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    return nextYear
  } else if (period === SubscriptionPeriod.ONCE) {
    // 24-hour pass
    const tomorrow = new Date(now)
    tomorrow.setHours(tomorrow.getHours() + 24)
    return tomorrow
  }

  return now
}
