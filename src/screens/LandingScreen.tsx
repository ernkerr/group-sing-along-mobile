import React, { useState } from 'react'
import { View, ScrollView, Modal, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Mic, BookOpen, Users, Smartphone, X } from 'lucide-react-native'
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
  const [isCreating, setIsCreating] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinCode, setJoinCode] = useState('')
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Mic size={24} color="#1f2937" />
          <BricolageText className="text-gray-900 text-xl font-semibold">
            Group Sing Along
          </BricolageText>
        </View>

        <View className="px-6 py-8">
          {/* Hero Section */}
          <View className="items-center mb-8">
            <BricolageText className="text-gray-900 text-center mb-4" style={{ fontSize: 36, fontWeight: 'bold', lineHeight: 44 }}>
              Make Group Singing Easy and Fun
            </BricolageText>
            <InterText className="text-gray-600 text-center mb-8" style={{ fontSize: 16, lineHeight: 24 }}>
              The perfect solution for family gatherings, parties, and any group sing-along event. Everyone sees the lyrics in real-time, controlled by a single host.
            </InterText>

            {/* Action Buttons */}
            <View className="w-full gap-4 mb-8">
              <Button
                onPress={handleCreateGroup}
                loading={isCreating}
                disabled={isCreating || isJoining}
                variant="gradient"
                size="lg"
              >
                <InterText className="text-white font-semibold text-lg">
                  Create Group
                </InterText>
              </Button>

              <Button
                onPress={() => setShowJoinInput(true)}
                variant="outline"
                size="lg"
                disabled={isCreating}
              >
                <InterText className="text-violet-600 font-semibold text-lg">
                  Join Group
                </InterText>
              </Button>
            </View>
          </View>

          {/* Join Group Modal */}
          <Modal
            visible={showJoinInput}
            transparent
            animationType="fade"
            onRequestClose={() => setShowJoinInput(false)}
          >
            <Pressable
              className="flex-1 bg-black/50 justify-center items-center px-6"
              onPress={() => setShowJoinInput(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View className="bg-white rounded-2xl p-8 w-full max-w-md" style={{ minWidth: 320 }}>
                  {/* Modal Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <BricolageText className="text-2xl font-bold text-gray-900">
                      Join Group
                    </BricolageText>
                    <Pressable
                      onPress={() => setShowJoinInput(false)}
                      className="p-2 -mr-2"
                    >
                      <X size={24} color="#6b7280" />
                    </Pressable>
                  </View>

                  {/* Modal Content */}
                  <InterText className="text-base text-gray-600 mb-6">
                    Enter the 4-letter code shared by your group host to join the sing-along session.
                  </InterText>

                  <View className="mb-6">
                    <InterText className="text-sm font-semibold text-gray-700 mb-2">
                      Group Code
                    </InterText>
                    <Input
                      placeholder="ABCD"
                      value={joinCode}
                      onChangeText={setJoinCode}
                      autoCapitalize="characters"
                      maxLength={4}
                      className="text-center text-2xl font-bold"
                    />
                  </View>

                  <View className="gap-3">
                    <Button
                      onPress={handleJoinGroup}
                      loading={isJoining}
                      disabled={joinCode.length !== 4}
                      variant="gradient"
                      size="lg"
                    >
                      <InterText className="text-white font-semibold text-lg">
                        Join Now
                      </InterText>
                    </Button>

                    <Button
                      onPress={() => {
                        setShowJoinInput(false)
                        setJoinCode('')
                      }}
                      variant="ghost"
                      size="lg"
                    >
                      <InterText className="text-gray-600 font-semibold text-base">
                        Cancel
                      </InterText>
                    </Button>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Example Preview Card with Backlit Shadow */}
          <View className="mb-8">
            <View
              style={{
                shadowColor: '#c084fc',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Card className="bg-white border border-gray-200 overflow-hidden">
                <View className="bg-gray-100 px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
                  <View className="flex-row items-center gap-2">
                    <Mic size={18} color="#6b7280" />
                    <InterText className="text-sm font-semibold text-gray-700">
                      Family Sing-Along
                    </InterText>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Users size={16} color="#6b7280" />
                    <InterText className="text-sm text-gray-600">12 members</InterText>
                  </View>
                </View>
                <View className="px-4 py-6">
                  <BricolageText className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Bohemian Rhapsody
                  </BricolageText>
                  <InterText className="text-base text-gray-600 text-center mb-6">
                    Queen
                  </InterText>
                  <View className="gap-3">
                    <InterText className="text-lg text-gray-900 text-center">
                      Is this the real life?
                    </InterText>
                    <InterText className="text-lg font-bold text-gray-900 text-center">
                      Is this just fantasy?
                    </InterText>
                    <InterText className="text-lg text-gray-900 text-center">
                      Caught in a landslide,
                    </InterText>
                    <InterText className="text-lg text-gray-900 text-center">
                      no escape from reality
                    </InterText>
                    <InterText className="text-lg text-gray-900 text-center">
                      I'm just a poor boy,
                    </InterText>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* How it Works */}
          <View className="mb-12">
            <BricolageText className="text-3xl font-bold text-gray-900 mb-3 text-center">
              How It Works
            </BricolageText>
            <InterText className="text-base text-gray-600 text-center mb-8">
              Get started in just three simple steps
            </InterText>

            <View className="gap-6">
              <View className="items-center">
                <View className="bg-gray-900 w-16 h-16 rounded-full items-center justify-center mb-4">
                  <InterText className="text-white font-bold text-2xl">1</InterText>
                </View>
                <BricolageText className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Create a Group
                </BricolageText>
                <InterText className="text-base text-gray-600 text-center">
                  Start a new sing-along session as the host and get a unique group code.
                </InterText>
              </View>

              <View className="items-center">
                <View className="bg-gray-900 w-16 h-16 rounded-full items-center justify-center mb-4">
                  <InterText className="text-white font-bold text-2xl">2</InterText>
                </View>
                <BricolageText className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Share the Code
                </BricolageText>
                <InterText className="text-base text-gray-600 text-center">
                  Invite others to join your group by sharing the unique code.
                </InterText>
              </View>

              <View className="items-center">
                <View className="bg-gray-900 w-16 h-16 rounded-full items-center justify-center mb-4">
                  <InterText className="text-white font-bold text-2xl">3</InterText>
                </View>
                <BricolageText className="text-xl font-bold text-gray-900 mb-2 text-center">
                  Start Singing
                </BricolageText>
                <InterText className="text-base text-gray-600 text-center">
                  Select songs and control the lyrics display for everyone in the group.
                </InterText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
