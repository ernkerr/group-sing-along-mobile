import AsyncStorage from '@react-native-async-storage/async-storage'
import { SubscriptionTier, SubscriptionPeriod, SessionInfo } from '@/types/subscription'

// Helper function to generate unique device ID
const generateUniqueId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const KEYS = {
  IS_HOST: 'isHost',
  GROUP_ID: 'groupId',
  SUBSCRIPTION_TIER: 'subscriptionTier',
  SUBSCRIPTION_PERIOD: 'subscriptionPeriod',
  SUBSCRIPTION_EXPIRY: 'subscriptionExpiry',
  SESSION_INFO: 'sessionInfo',
  DEVICE_ID: 'deviceId',
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

  // Session info
  getSessionInfo: async (): Promise<SessionInfo | null> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.SESSION_INFO)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error reading session info:', error)
      return null
    }
  },

  setSessionInfo: async (info: SessionInfo): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.SESSION_INFO, JSON.stringify(info))
    } catch (error) {
      console.error('Error saving session info:', error)
    }
  },

  // Device ID (for unique identification)
  getDeviceId: async (): Promise<string> => {
    try {
      let deviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID)
      if (!deviceId) {
        deviceId = generateUniqueId()
        await AsyncStorage.setItem(KEYS.DEVICE_ID, deviceId)
      }
      return deviceId
    } catch (error) {
      console.error('Error getting device ID:', error)
      return generateUniqueId()
    }
  },

  // Clear all (including new session info, but NOT device ID)
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.IS_HOST,
        KEYS.GROUP_ID,
        KEYS.SUBSCRIPTION_TIER,
        KEYS.SUBSCRIPTION_PERIOD,
        KEYS.SUBSCRIPTION_EXPIRY,
        KEYS.SESSION_INFO,
        // Note: We keep DEVICE_ID persistent across sessions
      ])
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error)
    }
  },
}
