import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp } from '@react-navigation/native'
import type { RootStackParamList } from '@/types'

type GroupScreenRouteProp = RouteProp<RootStackParamList, 'Group'>

export default function GroupScreen() {
  const route = useRoute<GroupScreenRouteProp>()
  const { id } = route.params

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-3xl font-bold text-gray-900">Group Screen</Text>
        <Text className="text-gray-600 mt-2">Group ID: {id}</Text>
        <Text className="text-gray-500 mt-4">Placeholder for group session</Text>
      </View>
    </SafeAreaView>
  )
}
