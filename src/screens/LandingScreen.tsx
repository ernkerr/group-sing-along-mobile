import React, { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { generateGroupCode } from '@/utils/generateCode'
import { storage } from '@/services/storage'
import type { RootStackParamList } from '@/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>

export default function LandingScreen() {
  const navigation = useNavigation<NavigationProp>()
  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const handleCreateGroup = async () => {
    setIsCreating(true)
    try {
      const groupId = generateGroupCode()
      await storage.setIsHost(true)
      await storage.setGroupId(groupId)
      navigation.navigate('Group', { id: groupId })
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || joinCode.length !== 4) {
      return
    }

    setIsJoining(true)
    try {
      const groupId = joinCode.toUpperCase()
      await storage.setIsHost(false)
      await storage.setGroupId(groupId)
      navigation.navigate('Group', { id: groupId })
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6">
        {/* Header */}
        <View className="items-center mb-12">
          <RocaText className="text-5xl text-gray-900 text-center mb-3">
            Group Sing Along
          </RocaText>
          <GaretText className="text-lg text-gray-600 text-center">
            Sing together in perfect sync
          </GaretText>
        </View>

        {/* Create Group Card */}
        <Card className="mb-4">
          <GaretText className="text-xl text-gray-900 font-semibold mb-2">
            Start a New Session
          </GaretText>
          <GaretText className="text-sm text-gray-600 mb-4">
            Create a group and share the code with others
          </GaretText>
          <Button
            onPress={handleCreateGroup}
            loading={isCreating}
            disabled={isJoining}
          >
            Create Group
          </Button>
        </Card>

        {/* Join Group Card */}
        <Card>
          <GaretText className="text-xl text-gray-900 font-semibold mb-2">
            Join a Session
          </GaretText>
          <GaretText className="text-sm text-gray-600 mb-4">
            Enter the 4-letter code from your host
          </GaretText>
          <Input
            placeholder="Enter code (e.g. ABCD)"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            maxLength={4}
            className="mb-4"
          />
          <Button
            onPress={handleJoinGroup}
            loading={isJoining}
            disabled={isCreating || joinCode.length !== 4}
            variant="outline"
          >
            Join Group
          </Button>
        </Card>
      </View>
    </SafeAreaView>
  )
}
