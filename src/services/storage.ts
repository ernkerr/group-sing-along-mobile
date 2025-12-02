import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  IS_HOST: 'isHost',
  GROUP_ID: 'groupId',
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

  // Clear all
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([KEYS.IS_HOST, KEYS.GROUP_ID])
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error)
    }
  },
}
