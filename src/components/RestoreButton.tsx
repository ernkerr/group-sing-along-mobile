import React, { useState, useRef } from 'react'
import { Alert } from 'react-native'
import {
  initConnection,
  endConnection,
  getAvailablePurchases,
  finishTransaction,
  Purchase,
} from 'react-native-iap'
import { storage } from '@/services/storage'
import { SubscriptionTier, SubscriptionPeriod, TIER_PRICES, calculateExpiry } from '@/types/subscription'
import { Button } from '@/components/ui/Button'
import { GaretText } from '@/components/ui/Typography'
import { MusicLoader } from '@/components/ui/MusicLoader'

interface RestoreButtonProps {
  onSuccess?: () => void
}

export function RestoreButton({ onSuccess }: RestoreButtonProps) {
  const [loading, setLoading] = useState(false)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const handleRestore = async () => {
    setLoading(true)
    let connectionInitialized = false

    try {
      // Initialize IAP connection first
      await initConnection()
      connectionInitialized = true

      // Get all available purchases from the store
      const restoredPurchases: Purchase[] = await getAvailablePurchases()

      if (restoredPurchases.length === 0) {
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any previous purchases."
        )
        return
      }

      // Find the highest tier subscription
      let highestTier: SubscriptionTier = SubscriptionTier.FREE
      let highestPeriod: SubscriptionPeriod = SubscriptionPeriod.MONTHLY
      let validPurchase: Purchase | null = null

      for (const purchase of restoredPurchases) {
        const { tier, period } = getTierFromSku(purchase.productId)

        if (tier && period) {
          // Priority: Party > Plus > Event > Free
          const tierPriority = {
            [SubscriptionTier.PARTY]: 3,
            [SubscriptionTier.PLUS]: 2,
            [SubscriptionTier.EVENT]: 1,
            [SubscriptionTier.FREE]: 0,
          }

          if (tierPriority[tier] > tierPriority[highestTier]) {
            highestTier = tier
            highestPeriod = period
            validPurchase = purchase
          }
        }
      }

      if (validPurchase && highestTier !== SubscriptionTier.FREE) {
        // Complete the transaction to acknowledge receipt
        await finishTransaction({ purchase: validPurchase })

        // Update local storage to reflect subscription
        await storage.setSubscriptionTier(highestTier)
        await storage.setSubscriptionPeriod(highestPeriod)

        // Calculate new expiry from now
        const expiry = calculateExpiry(highestPeriod)
        await storage.setSubscriptionExpiry(expiry.toISOString())

        Alert.alert('Restored', 'Your subscription has been restored.')
        onSuccessRef.current?.()
      } else {
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any valid subscriptions."
        )
      }
    } catch (err) {
      console.warn('Restore failed:', err)
      Alert.alert(
        'Error',
        'Failed to restore purchases. Please try again later.'
      )
    } finally {
      // Always clean up connection
      if (connectionInitialized) {
        await endConnection()
      }
      setLoading(false)
    }
  }

  return (
    <Button
      onPress={handleRestore}
      variant="outline"
      size="default"
      disabled={loading}
    >
      {loading ? (
        <MusicLoader size="small" />
      ) : (
        <GaretText className="font-semibold">
          Restore Purchase
        </GaretText>
      )}
    </Button>
  )
}

/**
 * Extract tier and period from SKU
 * SKU format: groupsingalong_{tier}_ios_{period}
 */
function getTierFromSku(sku: string): { tier: SubscriptionTier | null; period: SubscriptionPeriod | null } {
  // Check all possible SKUs
  for (const [tierKey, prices] of Object.entries(TIER_PRICES)) {
    const tier = tierKey as SubscriptionTier

    if ('monthly' in prices && prices.monthly.sku === sku) {
      return { tier, period: SubscriptionPeriod.MONTHLY }
    }
    if ('yearly' in prices && prices.yearly.sku === sku) {
      return { tier, period: SubscriptionPeriod.YEARLY }
    }
    if ('once' in prices && prices.once.sku === sku) {
      return { tier, period: SubscriptionPeriod.ONCE }
    }
  }

  return { tier: null, period: null }
}
