import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'react-native-iap'
import { storage } from '@/services/storage'
import { SubscriptionTier, SubscriptionPeriod, calculateExpiry, TIER_PRICES } from '@/types/subscription'
import { Button } from '@/components/ui/Button'
import { GaretText } from '@/components/ui/Typography'
import { MusicLoader } from '@/components/ui/MusicLoader'

interface BuyButtonProps {
  tier: SubscriptionTier
  period: SubscriptionPeriod
  onSuccess?: () => void
  variant?: 'default' | 'gradient' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function BuyButton({ tier, period, onSuccess, variant = 'gradient', size = 'default', className }: BuyButtonProps) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let purchaseUpdateSub: any
    let purchaseErrorSub: any

    const init = async () => {
      try {
        // Initialize IAP connection first
        await initConnection()

        // Get the SKU for this tier/period combination
        const sku = getSku(tier, period)
        if (!sku) {
          console.warn('No SKU found for tier:', tier, 'period:', period)
          return
        }

        // Load product info
        const products = await getProducts({ skus: [sku] })
        if (products && products.length > 0) {
          setProduct(products[0])
        }
      } catch (err) {
        console.warn('Error loading IAP products:', err)
      }

      // Listen to purchase updates
      purchaseUpdateSub = purchaseUpdatedListener(
        async (purchase: any) => {
          try {
            const receipt = purchase.transactionId || purchase.transactionReceipt
            if (receipt) {
              // Save subscription to storage
              await storage.setSubscriptionTier(tier)
              await storage.setSubscriptionPeriod(period)
              const expiry = calculateExpiry(period)
              await storage.setSubscriptionExpiry(expiry.toISOString())

              // Acknowledge / Finish transaction (very important!)
              await finishTransaction({ purchase })

              setLoading(false)
              onSuccess?.()
            }
          } catch (ackErr) {
            setLoading(false)
            console.warn('Failed to finish transaction:', ackErr)
          }
        }
      )

      // Listen to purchase errors
      purchaseErrorSub = purchaseErrorListener((error: any) => {
        setLoading(false)
        console.warn('Purchase error:', error)
        Alert.alert('Purchase failed', error.message || 'Please try again.')
      })
    }

    init()

    return () => {
      purchaseUpdateSub?.remove()
      purchaseErrorSub?.remove()
      endConnection()
    }
  }, [tier, period, onSuccess])

  const handleBuy = async () => {
    const sku = getSku(tier, period)
    if (!sku) {
      Alert.alert('Error', 'Invalid product configuration')
      return
    }

    setLoading(true)
    try {
      // @ts-ignore - API compatibility for react-native-iap
      await requestPurchase({ sku })
    } catch (err) {
      console.warn('Request purchase error:', err)
      Alert.alert('Purchase failed', 'Please try again.')
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return null

    if (product) {
      // Try different price property names for compatibility
      const price = product.localizedPrice || product.price || product.priceString || '...'

      // For event tier, show simple "Buy" text
      if (tier === SubscriptionTier.EVENT) {
        return `Get 24-Hour Pass — ${price}`
      }

      // For monthly/yearly, show appropriate text
      return period === SubscriptionPeriod.MONTHLY
        ? `Subscribe — ${price}/month`
        : `Subscribe — ${price}/year`
    }

    return 'Loading...'
  }

  return (
    <Button
      onPress={handleBuy}
      variant={variant}
      size={size}
      disabled={loading || !product}
      className={className}
    >
      {loading ? (
        <MusicLoader size="small" />
      ) : (
        <GaretText className="text-white font-semibold">
          {getButtonText()}
        </GaretText>
      )}
    </Button>
  )
}

/**
 * Get the SKU for a given tier and period
 */
function getSku(tier: SubscriptionTier, period: SubscriptionPeriod): string | null {
  if (tier === SubscriptionTier.FREE) return null

  const prices = TIER_PRICES[tier]
  if (!prices) return null

  if (tier === SubscriptionTier.EVENT && 'once' in prices) {
    return prices.once.sku
  }

  if (period === SubscriptionPeriod.MONTHLY && 'monthly' in prices) {
    return prices.monthly.sku
  }

  if (period === SubscriptionPeriod.YEARLY && 'yearly' in prices) {
    return prices.yearly.sku
  }

  return null
}
