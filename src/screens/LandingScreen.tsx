import React, { useState } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BricolageText, InterText } from '@/components/ui/Typography'
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
    <SafeAreaView className="flex-1 bg-violet-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 py-12">
          {/* Hero Section */}
          <View className="items-center mb-16">
            <BricolageText className="text-gray-900 text-center mb-4" style={{ fontSize: 48, fontWeight: 'bold' }}>
              Group Sing Along
            </BricolageText>
            <InterText className="text-gray-600 text-center" style={{ fontSize: 18, maxWidth: 400 }}>
              The ultimate way to sing together. Sync lyrics across all devices instantly.
            </InterText>
          </View>

          {/* Action Buttons */}
          <View className="mb-12 gap-3">
            <Button
              onPress={handleCreateGroup}
              loading={isCreating}
              disabled={isJoining}
              variant="gradient"
              className="py-4"
            >
              Create Group
            </Button>
            
            <Button
              onPress={() => {}}
              variant="outline"
              className="py-4 border-violet-300"
            >
              Join Group
            </Button>
          </View>

          {/* Join Code Input */}
          <Card className="mb-8 bg-white border border-gray-200 shadow-sm">
            <InterText className="text-sm font-semibold text-gray-700 mb-3">
              Have a group code?
            </InterText>
            <Input
              placeholder="Enter 4-letter code"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={4}
              className="mb-3"
            />
            <Button
              onPress={handleJoinGroup}
              loading={isJoining}
              disabled={isCreating || joinCode.length !== 4}
              variant="gradient"
              size="sm"
            >
              Join Now
            </Button>
          </Card>

          {/* How it Works */}
          <View className="mb-12">
            <InterText className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How it Works
            </InterText>
            
            <View className="gap-4">
              <Card className="bg-violet-100 border-0">
                <View className="flex-row items-start gap-3">
                  <View className="bg-violet-500 w-8 h-8 rounded-full items-center justify-center">
                    <InterText className="text-white font-bold">1</InterText>
                  </View>
                  <View className="flex-1">
                    <InterText className="font-semibold text-gray-900 mb-1">
                      Create a Group
                    </InterText>
                    <InterText className="text-sm text-gray-600">
                      Start a new sing-along session and get a unique group code
                    </InterText>
                  </View>
                </View>
              </Card>

              <Card className="bg-violet-100 border-0">
                <View className="flex-row items-start gap-3">
                  <View className="bg-violet-500 w-8 h-8 rounded-full items-center justify-center">
                    <InterText className="text-white font-bold">2</InterText>
                  </View>
                  <View className="flex-1">
                    <InterText className="font-semibold text-gray-900 mb-1">
                      Share the Code
                    </InterText>
                    <InterText className="text-sm text-gray-600">
                      Invite others to join by sharing the unique code
                    </InterText>
                  </View>
                </View>
              </Card>

              <Card className="bg-violet-100 border-0">
                <View className="flex-row items-start gap-3">
                  <View className="bg-violet-500 w-8 h-8 rounded-full items-center justify-center">
                    <InterText className="text-white font-bold">3</InterText>
                  </View>
                  <View className="flex-1">
                    <InterText className="font-semibold text-gray-900 mb-1">
                      Start Singing
                    </InterText>
                    <InterText className="text-sm text-gray-600">
                      Control lyrics for everyone in the group in real-time
                    </InterText>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
