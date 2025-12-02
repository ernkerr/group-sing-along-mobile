import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Input } from '@/components/ui/Input'
import { ShareModal } from '@/components/ShareModal'
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

  // Song search state (for hosts)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false)

  // Share modal state
  const [isShareModalVisible, setIsShareModalVisible] = useState(false)

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

  // Handle host disconnect - notify all members
  const handleHostDisconnect = useCallback(async () => {
    if (!isHost) return

    try {
      console.log('Host is disconnecting')
      await api.triggerPusherEvent(`group-lyrics-${groupId}`, 'host-disconnect', {
        message: 'Host has ended the session',
      })
    } catch (error) {
      console.error('Error sending host disconnect message:', error)
    }
  }, [isHost, groupId])

  // Handle receiving host disconnect event (for non-hosts)
  const handleHostDisconnectReceived = useCallback(() => {
    Alert.alert(
      'Session Ended',
      'The host has ended the session',
      [
        {
          text: 'OK',
          onPress: async () => {
            await storage.clearAll()
            navigation.goBack()
          },
        },
      ],
      { cancelable: false }
    )
  }, [navigation])

  // Initialize Pusher connection
  usePusher(groupId, {
    onLyricUpdate: handleLyricUpdate,
    onNewUserJoined: handleNewUserJoined,
    onSubscriptionCount: setMemberCount,
    onSubscriptionSucceeded: handleSubscriptionSucceeded,
    onHostDisconnect: handleHostDisconnectReceived,
  })

  // Handle app state changes for host disconnect
  useEffect(() => {
    if (!isHost) return

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If host is backgrounding or quitting the app
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        handleHostDisconnect()
      }
    })

    // Cleanup on unmount - notify users that host is leaving
    return () => {
      subscription.remove()
      handleHostDisconnect()
    }
  }, [isHost, handleHostDisconnect])

  const handleLeaveGroup = async () => {
    if (isHost) {
      await handleHostDisconnect()
    }
    await storage.clearAll()
    navigation.goBack()
  }

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 32))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 10))

  // Search for songs (Deezer)
  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      console.log('Searching for:', searchTerm)
      const results = await api.searchSongs(searchTerm)
      console.log('Search results:', results)
      console.log('Number of results:', results.length)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching songs:', error)
      Alert.alert('Search Error', 'Unable to search for songs. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Select a song and fetch/broadcast lyrics
  const handleSelectSong = async (song: any) => {
    setIsFetchingLyrics(true)
    setSearchResults([]) // Clear search results immediately

    try {
      // Fetch lyrics
      const fetchedLyrics = await api.fetchLyrics(song.artist.name, song.title)

      // Update local state
      setLyrics(fetchedLyrics)
      setCurrentSong(song.title)
      setCurrentArtist(song.artist.name)
      setAlbumCover(song.album.cover_medium)

      // Broadcast to all users via Pusher
      await api.triggerPusherEvent(`group-lyrics-${groupId}`, 'lyric-update', {
        lyrics: fetchedLyrics,
        title: song.title,
        artist: song.artist.name,
        albumCover: song.album.cover_medium,
      })

      setSearchTerm('')
    } catch (error) {
      console.error('Error selecting song:', error)
      Alert.alert(
        'No Lyrics Found',
        'No lyrics found for this song. Please try another song or reach out to the developer.'
      )
    } finally {
      setIsFetchingLyrics(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c084fc" />
          <GaretText className="text-gray-600 mt-4">Loading...</GaretText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 my-6">
          {/* Card with Gradient Header */}
          <View className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header with Gradient Background */}
            <LinearGradient
              colors={['#c084fc', '#d8b4fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-6 py-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <RocaText className="text-xl text-white font-bold">
                    Group Sing Along
                  </RocaText>
                </View>
                <Pressable
                  onPress={() => setIsShareModalVisible(true)}
                  className="bg-violet-300 px-3 py-2 rounded-md flex-row items-center gap-2 shadow-lg active:bg-violet-400"
                >
                  <GaretText className="text-white text-sm font-semibold">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </GaretText>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Card Content */}
            <View className="px-6 py-3">
              {/* Role and Group Code */}
              <View className="flex-row items-center justify-between mb-4">
                <GaretText className="text-sm text-gray-700">
                  Role: {isHost ? 'Host' : 'Singer'}
                </GaretText>
                <GaretText className="text-sm text-gray-700">
                  Group Code: {groupId}
                </GaretText>
              </View>

              {/* Host Controls - Song Search */}
              {isHost && (
                <View className="mb-4">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Input
                        placeholder="Search for a song"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        editable={!isSearching}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        className="shadow-md"
                      />
                    </View>
                    <Pressable
                      onPress={handleSearch}
                      disabled={isSearching || !searchTerm.trim()}
                      className={`px-4 py-3 rounded-md flex-row items-center gap-2 justify-center shadow-md ${
                        isSearching || !searchTerm.trim()
                          ? 'bg-gray-300'
                          : 'bg-gradient-to-r from-violet-400 to-violet-300'
                      }`}
                    >
                      {isSearching ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <GaretText className="text-white font-semibold">Search</GaretText>
                      )}
                    </Pressable>
                  </View>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <View className="mt-4">
                      {searchResults.map((result, index) => (
                        <Pressable
                          key={index}
                          onPress={() => handleSelectSong(result)}
                          className="p-4 rounded-md hover:bg-violet-100 active:bg-violet-200 mb-1"
                          style={({ pressed }) => ({
                            backgroundColor: pressed ? '#ddd6fe' : 'transparent',
                          })}
                        >
                          <GaretText className="text-base text-gray-900">
                            {result.display || `${result.title} - ${result.artist.name}`}
                          </GaretText>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Current Song Display */}
              {currentSong && (
                <View className="flex-row items-center gap-3 mb-3">
                  {albumCover && (
                    <Image
                      source={{ uri: albumCover }}
                      className="w-12 h-12 rounded-lg"
                      style={{ width: 50, height: 50 }}
                    />
                  )}
                  <View className="flex-1">
                    <GaretText className="text-xl font-semibold text-gray-900">
                      {currentSong}
                    </GaretText>
                    <GaretText className="text-base text-gray-400">
                      {currentArtist}
                    </GaretText>
                  </View>
                </View>
              )}

              {/* Lyrics Section Header */}
              <View className="flex-row items-center justify-between mb-2">
                <GaretText className="text-lg font-semibold text-gray-900">
                  Lyrics:
                </GaretText>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={decreaseFontSize}
                    className="w-8 h-8 border border-gray-300 rounded items-center justify-center"
                  >
                    <GaretText className="text-base text-gray-700">-</GaretText>
                  </Pressable>
                  <Pressable
                    onPress={increaseFontSize}
                    className="w-8 h-8 border border-gray-300 rounded items-center justify-center"
                  >
                    <GaretText className="text-base text-gray-700">+</GaretText>
                  </Pressable>
                </View>
              </View>

              {/* Lyrics Display */}
              <View
                className="rounded-lg min-h-[400px] p-4 bg-gray-50"
                style={{ minHeight: 400 }}
              >
                {isSearching ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#c084fc" />
                    <GaretText className="text-gray-400 mt-4">
                      Searching for songs...
                    </GaretText>
                  </View>
                ) : isFetchingLyrics ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#c084fc" />
                    <GaretText className="text-gray-400 mt-4">
                      Loading lyrics...
                    </GaretText>
                  </View>
                ) : (
                  <GaretText
                    style={{ fontSize, lineHeight: fontSize * 1.8 }}
                    className="text-gray-900"
                  >
                    {lyrics || 'Waiting for the Host to select a song...'}
                  </GaretText>
                )}
              </View>
            </View>
          </View>

          {/* Share Button */}
          <Pressable
            onPress={() => setIsShareModalVisible(true)}
            className="mt-6 bg-violet-300 px-4 py-3 rounded-md flex-row items-center justify-center gap-2 shadow-lg active:bg-violet-400"
          >
            <GaretText className="text-white font-semibold">Share</GaretText>
          </Pressable>

          {/* Leave Group Button */}
          <Pressable
            onPress={handleLeaveGroup}
            className="mt-4 border border-gray-300 px-4 py-3 rounded-md items-center active:bg-gray-100"
          >
            <GaretText className="text-gray-700 font-semibold">Leave Group</GaretText>
          </Pressable>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <ShareModal
        isVisible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        groupId={groupId}
      />
    </SafeAreaView>
  )
}
