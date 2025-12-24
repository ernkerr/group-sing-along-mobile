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

export interface SessionInfo {
  hostTier: SubscriptionTier
  memberLimit: number
  currentCount: number
  expiresAt?: string  // ISO date string (for EVENT tier)
  createdAt: string   // ISO date string
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
  [SubscriptionTier.FREE]: parseInt(process.env.EXPO_PUBLIC_FREE_LIMIT || '3'),
  [SubscriptionTier.PLUS]: parseInt(process.env.EXPO_PUBLIC_PLUS_LIMIT || '10'),
  [SubscriptionTier.PARTY]: parseInt(process.env.EXPO_PUBLIC_PARTY_LIMIT || '25'),
  [SubscriptionTier.EVENT]: parseInt(process.env.EXPO_PUBLIC_EVENT_LIMIT || '25')
}

export const EVENT_DURATION_HOURS = parseInt(
  process.env.EXPO_PUBLIC_EVENT_DURATION_HOURS || '24'
)

export const TIER_PRICES = {
  [SubscriptionTier.PLUS]: {
    monthly: {
      price: parseFloat(process.env.EXPO_PUBLIC_PLUS_MONTHLY_PRICE || '1.99'),
      sku: 'groupsingalong_plus_ios_monthly'
    },
    yearly: {
      price: parseFloat(process.env.EXPO_PUBLIC_PLUS_YEARLY_PRICE || '20'),
      sku: 'groupsingalong_plus_ios_yearly'
    }
  },
  [SubscriptionTier.PARTY]: {
    monthly: {
      price: parseFloat(process.env.EXPO_PUBLIC_PARTY_MONTHLY_PRICE || '5.99'),
      sku: 'groupsingalong_party_ios_monthly'
    },
    yearly: {
      price: parseFloat(process.env.EXPO_PUBLIC_PARTY_YEARLY_PRICE || '60'),
      sku: 'groupsingalong_party_ios_yearly'
    }
  },
  [SubscriptionTier.EVENT]: {
    once: {
      price: parseFloat(process.env.EXPO_PUBLIC_EVENT_PRICE || '3.99'),
      sku: 'groupsingalong_event_ios_24h'
    }
  }
}

export const PRICING_TIERS: PricingTier[] = [
  {
    tier: SubscriptionTier.PLUS,
    name: 'Plus',
    emoji: '🎶',
    memberLimit: TIER_LIMITS[SubscriptionTier.PLUS],
    monthlyPrice: TIER_PRICES[SubscriptionTier.PLUS].monthly.price,
    yearlyPrice: TIER_PRICES[SubscriptionTier.PLUS].yearly.price,
    valueStatement: 'For small groups who want it to just work.',
    features: [
      `Up to ${TIER_LIMITS[SubscriptionTier.PLUS]} people`,
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
    memberLimit: TIER_LIMITS[SubscriptionTier.PARTY],
    monthlyPrice: TIER_PRICES[SubscriptionTier.PARTY].monthly.price,
    yearlyPrice: TIER_PRICES[SubscriptionTier.PARTY].yearly.price,
    valueStatement: 'For holidays, parties, and family gatherings.',
    features: [
      `Up to ${TIER_LIMITS[SubscriptionTier.PARTY]} people`,
      'Faster sync for bigger groups',
      'Designed for group events',
      'One host, zero confusion'
    ]
  },
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    emoji: '🆓',
    memberLimit: TIER_LIMITS[SubscriptionTier.FREE],
    valueStatement: 'Perfect for trying it out',
    features: [
      `Up to ${TIER_LIMITS[SubscriptionTier.FREE]} people`,
      'Host controls lyrics',
      'Real-time sync',
      'No account required'
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
