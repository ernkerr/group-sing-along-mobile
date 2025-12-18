import AsyncStorage from '@react-native-async-storage/async-storage'
import { SubscriptionTier, SubscriptionPeriod } from '@/types/subscription'

const KEYS = {
  IS_HOST: 'isHost',
  GROUP_ID: 'groupId',
  SUBSCRIPTION_TIER: 'subscriptionTier',
  SUBSCRIPTION_PERIOD: 'subscriptionPeriod',
  SUBSCRIPTION_EXPIRY: 'subscriptionExpiry',
}

export const storage = {
  // Host flag
  setIsHost: async (value: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.IS_HOST, value.toString())
    } catch (error) {
      console.error('Error saving isHost to AsyncStorage:', error)
    }
  },

  getIsHost: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.IS_HOST)
      return value === 'true'
    } catch (error) {
      console.error('Error reading isHost from AsyncStorage:', error)
      return false
    }
  },

  removeIsHost: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.IS_HOST)
    } catch (error) {
      console.error('Error removing isHost from AsyncStorage:', error)
    }
  },

  // Group ID
  setGroupId: async (value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.GROUP_ID, value)
    } catch (error) {
      console.error('Error saving groupId to AsyncStorage:', error)
    }
  },

  getGroupId: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.GROUP_ID)
    } catch (error) {
      console.error('Error reading groupId from AsyncStorage:', error)
      return null
    }
  },

  removeGroupId: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.GROUP_ID)
    } catch (error) {
      console.error('Error removing groupId from AsyncStorage:', error)
    }
  },

  // Subscription tier
  getSubscriptionTier: async (): Promise<SubscriptionTier> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.SUBSCRIPTION_TIER)
      return (value as SubscriptionTier) || SubscriptionTier.FREE
    } catch (error) {
      console.error('Error reading subscription tier:', error)
      return SubscriptionTier.FREE
    }
  },

  setSubscriptionTier: async (tier: SubscriptionTier): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.SUBSCRIPTION_TIER, tier)
    } catch (error) {
      console.error('Error saving subscription tier:', error)
    }
  },

  // Subscription period
  getSubscriptionPeriod: async (): Promise<SubscriptionPeriod | null> => {
    try {
      return (await AsyncStorage.getItem(KEYS.SUBSCRIPTION_PERIOD)) as SubscriptionPeriod | null
    } catch (error) {
      console.error('Error reading subscription period:', error)
      return null
    }
  },

  setSubscriptionPeriod: async (period: SubscriptionPeriod): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.SUBSCRIPTION_PERIOD, period)
    } catch (error) {
      console.error('Error saving subscription period:', error)
    }
  },

  // Subscription expiry
  getSubscriptionExpiry: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.SUBSCRIPTION_EXPIRY)
    } catch (error) {
      console.error('Error reading subscription expiry:', error)
      return null
    }
  },

  setSubscriptionExpiry: async (date: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.SUBSCRIPTION_EXPIRY, date)
    } catch (error) {
      console.error('Error saving subscription expiry:', error)
    }
  },

  // Clear all
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.IS_HOST,
        KEYS.GROUP_ID,
        KEYS.SUBSCRIPTION_TIER,
        KEYS.SUBSCRIPTION_PERIOD,
        KEYS.SUBSCRIPTION_EXPIRY,
      ])
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error)
    }
  },
}
