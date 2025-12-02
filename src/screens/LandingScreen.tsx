import React from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RocaText, GaretText } from '@/components/ui/Typography'

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <RocaText className="text-4xl text-gray-900 text-center">
          Group Sing Along
        </RocaText>
        <GaretText className="text-lg text-gray-600 mt-2 text-center">
          Welcome! Create or join a group to start singing.
        </GaretText>
      </View>
    </SafeAreaView>
  )
}
