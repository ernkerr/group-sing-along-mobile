import { useState, useEffect } from 'react'
import { storage } from '@/services/storage'
import { SubscriptionTier, TIER_LIMITS } from '@/types/subscription'

export function useSubscription() {
  const [tier, setTier] = useState<SubscriptionTier>(SubscriptionTier.FREE)
  const [isActive, setIsActive] = useState(false)
  const [memberLimit, setMemberLimit] = useState(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    try {
      setLoading(true)
      const tier = await storage.getSubscriptionTier()
      const expiry = await storage.getSubscriptionExpiry()

      // Check if expired
      const isExpired = expiry ? new Date(expiry) < new Date() : false
      const activeTier = isExpired ? SubscriptionTier.FREE : tier

      // If expired, downgrade to free tier in storage
      if (isExpired && tier !== SubscriptionTier.FREE) {
        await storage.setSubscriptionTier(SubscriptionTier.FREE)
      }

      setTier(activeTier)
      setIsActive(!isExpired && tier !== SubscriptionTier.FREE)
      setMemberLimit(TIER_LIMITS[activeTier])
    } catch (error) {
      console.error('Error loading subscription:', error)
      setTier(SubscriptionTier.FREE)
      setIsActive(false)
      setMemberLimit(3)
    } finally {
      setLoading(false)
    }
  }

  function canInviteMore(currentCount: number): boolean {
    return currentCount < memberLimit
  }

  return {
    tier,
    isActive,
    memberLimit,
    loading,
    canInviteMore,
    refresh: loadSubscription,
  }
}
