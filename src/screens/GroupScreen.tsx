import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { storage } from '@/services/storage'
import type { RootStackParamList } from '@/types'

type GroupScreenRouteProp = RouteProp<RootStackParamList, 'Group'>

export default function GroupScreen() {
  const route = useRoute<GroupScreenRouteProp>()
  const navigation = useNavigation()
  const { id: groupId } = route.params
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRole()
  }, [])

  const loadRole = async () => {
    try {
      const hostStatus = await storage.getIsHost()
      setIsHost(hostStatus)
    } catch (error) {
      console.error('Error loading role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    await storage.clearAll()
    navigation.goBack()
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <GaretText className="text-gray-600">Loading...</GaretText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-6">
        {/* Header */}
        <View className="items-center mb-8">
          <GaretText className="text-sm text-gray-500 uppercase tracking-wide mb-2">
            {isHost ? 'Host' : 'Singer'}
          </GaretText>
          <RocaText className="text-6xl text-blue-600 font-bold tracking-wider">
            {groupId}
          </RocaText>
          <GaretText className="text-sm text-gray-600 mt-2">
            Group Code
          </GaretText>
        </View>

        {/* Content */}
        <Card className="mb-4">
          <GaretText className="text-lg text-gray-900 font-semibold mb-2">
            {isHost ? 'You are the Host' : 'You are a Singer'}
          </GaretText>
          <GaretText className="text-sm text-gray-600">
            {isHost
              ? 'Share the code above with others. Search for songs to get started!'
              : 'Waiting for the host to select a song...'}
          </GaretText>
        </Card>

        {/* Placeholder for future features */}
        <Card className="flex-1 mb-4">
          <GaretText className="text-gray-500 text-center">
            {isHost ? 'Song search will appear here' : 'Lyrics will appear here'}
          </GaretText>
        </Card>

        {/* Leave Button */}
        <Button onPress={handleLeaveGroup} variant="outline">
          Leave Group
        </Button>
      </View>
    </SafeAreaView>
  )
}
