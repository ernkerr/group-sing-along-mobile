import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { storage } from '@/services/storage'
import { usePusher } from '@/hooks/usePusher'
import { api } from '@/services/api'
import type { RootStackParamList } from '@/types'

type GroupScreenRouteProp = RouteProp<RootStackParamList, 'Group'>

export default function GroupScreen() {
  const route = useRoute<GroupScreenRouteProp>()
  const navigation = useNavigation()
  const { id: groupId } = route.params
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)

  // Pusher state
  const [lyrics, setLyrics] = useState('')
  const [currentSong, setCurrentSong] = useState('')
  const [currentArtist, setCurrentArtist] = useState('')
  const [albumCover, setAlbumCover] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [fontSize, setFontSize] = useState(16)

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

  // Pusher event handlers (based on web app)
  const handleLyricUpdate = useCallback((data: any) => {
    console.log('Received lyric update:', data)
    setLyrics(data.lyrics)
    setCurrentSong(data.title)
    setCurrentArtist(data.artist)
    if (data.albumCover) {
      setAlbumCover(data.albumCover)
    }
  }, [])

  const handleNewUserJoined = useCallback(async () => {
    console.log('Host received new-user-joined event')
    if (isHost && lyrics && currentSong) {
      try {
        await api.triggerPusherEvent(`group-lyrics-${groupId}`, 'lyric-update', {
          title: currentSong,
          artist: currentArtist,
          lyrics: lyrics,
          albumCover,
        })
      } catch (error) {
        console.error('Error re-broadcasting lyrics:', error)
      }
    }
  }, [isHost, lyrics, currentSong, currentArtist, albumCover, groupId])

  const handleSubscriptionSucceeded = useCallback(async () => {
    // When a new user joins, request current lyrics
    if (!isHost) {
      console.log('New user subscription succeeded, requesting lyrics')
      try {
        await api.triggerPusherEvent(`group-lyrics-${groupId}`, 'new-user-joined', {
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('Error requesting lyrics:', error)
      }
    }
  }, [isHost, groupId])

  // Initialize Pusher connection
  usePusher(groupId, {
    onLyricUpdate: handleLyricUpdate,
    onNewUserJoined: handleNewUserJoined,
    onSubscriptionCount: setMemberCount,
    onSubscriptionSucceeded: handleSubscriptionSucceeded,
  })

  const handleLeaveGroup = async () => {
    await storage.clearAll()
    navigation.goBack()
  }

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 32))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12))

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
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <GaretText className="text-sm text-gray-500 uppercase tracking-wide">
              {isHost ? 'Host' : 'Singer'}
            </GaretText>
            {memberCount > 0 && (
              <View className="flex-row items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <GaretText className="text-xs text-gray-600">{memberCount}</GaretText>
              </View>
            )}
          </View>
          <RocaText className="text-6xl text-blue-600 font-bold tracking-wider">
            {groupId}
          </RocaText>
          <GaretText className="text-sm text-gray-600 mt-1">
            Group Code
          </GaretText>
        </View>

        {/* Current Song Info */}
        {currentSong && (
          <Card className="mb-4">
            <View className="flex-row items-center gap-3">
              {albumCover && (
                <View className="w-12 h-12 bg-gray-200 rounded" />
              )}
              <View className="flex-1">
                <GaretText className="text-base font-semibold text-gray-900">
                  {currentSong}
                </GaretText>
                <GaretText className="text-sm text-gray-600">
                  {currentArtist}
                </GaretText>
              </View>
            </View>
          </Card>
        )}

        {/* Lyrics Display */}
        <Card className="flex-1 mb-4">
          {lyrics ? (
            <>
              {/* Font Size Controls */}
              <View className="flex-row justify-end gap-2 mb-3">
                <Button
                  onPress={decreaseFontSize}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10"
                >
                  <GaretText className="text-lg">-</GaretText>
                </Button>
                <Button
                  onPress={increaseFontSize}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10"
                >
                  <GaretText className="text-lg">+</GaretText>
                </Button>
              </View>

              {/* Lyrics ScrollView */}
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
              >
                <GaretText
                  style={{ fontSize }}
                  className="text-gray-900 leading-relaxed"
                >
                  {lyrics}
                </GaretText>
              </ScrollView>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <GaretText className="text-gray-500 text-center">
                {isHost
                  ? 'Song search will appear here'
                  : 'Waiting for the host to select a song...'}
              </GaretText>
            </View>
          )}
        </Card>

        {/* Leave Button */}
        <Button onPress={handleLeaveGroup} variant="outline">
          Leave Group
        </Button>
      </View>
    </SafeAreaView>
  )
}
