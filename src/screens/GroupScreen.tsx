import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Input } from '@/components/ui/Input'
import { ShareModal } from '@/components/ShareModal'
import { storage } from '@/services/storage'
import { usePusher } from '@/hooks/usePusher'
import { api } from '@/services/api'
import type { RootStackParamList } from '@/types'

type GroupScreenRouteProp = RouteProp<RootStackParamList, 'Group'>

interface SearchResult {
  display?: string
  artist: {
    name: string
  }
  title: string
  album: {
    cover?: string
    cover_medium: string
  }
}

interface SongRequest {
  title: string
  artist: string
  albumCover: string
  timestamp: number
  requestCount: number
}

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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false)

  // Singer search state (for non-hosts)
  const [singerSearchTerm, setSingerSearchTerm] = useState('')
  const [singerSearchResults, setSingerSearchResults] = useState<SearchResult[]>([])
  const [isSingerSearching, setIsSingerSearching] = useState(false)

  // Song requests state (for hosts)
  const [songRequests, setSongRequests] = useState<SongRequest[]>([])
  const [isRequestDropdownOpen, setIsRequestDropdownOpen] = useState(false)

  // Share modal state
  const [isShareModalVisible, setIsShareModalVisible] = useState(false)

  // Pulse animation for loading states
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadRole()
  }, [])

  // Pulse animation effect when loading
  useEffect(() => {
    if (isSearching || isFetchingLyrics) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isSearching, isFetchingLyrics, pulseAnim])

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
  const handleLyricUpdate = useCallback(
    (data: any) => {
      console.log('Received lyric update:', data)
      setLyrics(data.lyrics)
      setCurrentSong(data.title)
      setCurrentArtist(data.artist)
      if (data.albumCover) {
        setAlbumCover(data.albumCover)
      }

      // Auto-remove matching song request (for hosts)
      if (isHost) {
        setSongRequests((prevRequests) =>
          prevRequests.filter(
            (req) =>
              !(
                req.title.toLowerCase() === data.title.toLowerCase() &&
                req.artist.toLowerCase() === data.artist.toLowerCase()
              )
          )
        )
      }
    },
    [isHost]
  )

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

  // Handle song request (for hosts)
  const handleSongRequest = useCallback(
    (data: { title: string; artist: string; albumCover: string; timestamp: number }) => {
      if (!isHost) return

      console.log('Received song request:', data)

      setSongRequests((prevRequests) => {
        const existingIndex = prevRequests.findIndex(
          (req) =>
            req.title.toLowerCase() === data.title.toLowerCase() &&
            req.artist.toLowerCase() === data.artist.toLowerCase()
        )

        if (existingIndex !== -1) {
          // Merge duplicate - increment request count
          const updated = [...prevRequests]
          updated[existingIndex] = {
            ...updated[existingIndex],
            requestCount: updated[existingIndex].requestCount + 1,
          }
          return updated
        } else {
          // New request
          return [
            ...prevRequests,
            {
              title: data.title,
              artist: data.artist,
              albumCover: data.albumCover,
              timestamp: data.timestamp,
              requestCount: 1,
            },
          ]
        }
      })
    },
    [isHost]
  )

  // Initialize Pusher connection
  usePusher(groupId, {
    onLyricUpdate: handleLyricUpdate,
    onNewUserJoined: handleNewUserJoined,
    onSubscriptionCount: setMemberCount,
    onSubscriptionSucceeded: handleSubscriptionSucceeded,
    onHostDisconnect: handleHostDisconnectReceived,
    onSongRequest: handleSongRequest,
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

  // Search for songs (Deezer) - Host
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

  // Search for songs (Deezer) - Singer
  const searchSongAsSinger = async () => {
    if (!singerSearchTerm.trim()) return

    setIsSingerSearching(true)
    try {
      console.log('Singer searching for:', singerSearchTerm)
      const results = await api.searchSongs(singerSearchTerm)
      console.log('Singer search results:', results)
      setSingerSearchResults(results)
    } catch (error) {
      console.error('Error searching songs for singer:', error)
      Alert.alert('Search Error', 'Failed to search songs. Please try again.')
    } finally {
      setIsSingerSearching(false)
    }
  }

  // Request a song (Singer -> Host)
  const requestSong = async (title: string, artist: string, albumCover: string) => {
    try {
      setSingerSearchResults([])
      setSingerSearchTerm('')

      await api.triggerPusherEvent(`group-lyrics-${groupId}`, 'song-request', {
        title,
        artist,
        albumCover,
        timestamp: Date.now(),
      })

      Alert.alert('Request Sent!', `"${title}" by ${artist} has been requested.`)
    } catch (error) {
      console.error('Error requesting song:', error)
      Alert.alert('Request Failed', 'Failed to send song request. Please try again.')
    }
  }

  // Accept a song request (Host)
  const acceptSongRequest = async (request: SongRequest) => {
    console.log('Host accepting song request:', request)
    setIsRequestDropdownOpen(false)
    await handleSelectSong({
      title: request.title,
      artist: { name: request.artist },
      album: { cover_medium: request.albumCover },
    } as any)
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
        title: song.title,
        artist: song.artist.name,
        lyrics: fetchedLyrics,
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
          <View className="bg-white rounded-lg overflow-hidden shadow-xl">
            {/* Header with Gradient Background */}
            <LinearGradient
              colors={['#c084fc', '#d8b4fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-6 py-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="mic" size={24} color="white" />
                  <RocaText className="text-xl text-white font-bold">
                    Group Sing Along
                  </RocaText>
                </View>
                <Pressable
                  onPress={() => setIsShareModalVisible(true)}
                  className="bg-violet-300 px-3 py-2 rounded-md flex-row items-center gap-2 shadow-lg active:bg-violet-400"
                >
                  <Ionicons name="people" size={16} color="white" />
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

              {/* Singer Controls - Song Request */}
              {!isHost && (
                <View className="space-y-3">
                  <GaretText className="text-sm font-semibold text-gray-700">
                    Request a Song
                  </GaretText>

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Input
                        placeholder="Search for a song to request"
                        value={singerSearchTerm}
                        onChangeText={setSingerSearchTerm}
                        editable={!isSingerSearching}
                        returnKeyType="search"
                        onSubmitEditing={searchSongAsSinger}
                        className="shadow-md"
                      />
                    </View>
                    <LinearGradient
                      colors={
                        isSingerSearching || !singerSearchTerm.trim()
                          ? ['#d1d5db', '#d1d5db']
                          : ['#c084fc', '#d8b4fe']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 6 }}
                    >
                      <Pressable
                        onPress={searchSongAsSinger}
                        disabled={isSingerSearching || !singerSearchTerm.trim()}
                        className="px-4 py-3 flex-row items-center gap-2 justify-center"
                      >
                        {isSingerSearching ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="search" size={16} color="white" />
                            <GaretText className="text-white font-semibold">Search</GaretText>
                          </>
                        )}
                      </Pressable>
                    </LinearGradient>
                  </View>

                  {/* Singer Search Results */}
                  {singerSearchResults.length > 0 && (
                    <View className="mt-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64">
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {singerSearchResults.map((result, index) => (
                          <View
                            key={index}
                            className="p-3 flex-row items-center justify-between border-b border-gray-200"
                          >
                            <GaretText className="text-sm flex-1">
                              {result.display || `${result.title} - ${result.artist.name}`}
                            </GaretText>
                            <Pressable
                              onPress={() =>
                                requestSong(
                                  result.title,
                                  result.artist.name,
                                  result.album.cover || result.album.cover_medium
                                )
                              }
                              className="bg-violet-400 px-3 py-2 rounded active:bg-violet-500"
                            >
                              <GaretText className="text-white text-xs font-semibold">
                                Request
                              </GaretText>
                            </Pressable>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Host Controls - Song Search */}
              {isHost && (
                <View className="space-y-4">
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
                    <LinearGradient
                      colors={isSearching || !searchTerm.trim() ? ['#d1d5db', '#d1d5db'] : ['#c084fc', '#d8b4fe']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 6 }}
                    >
                      <Pressable
                        onPress={handleSearch}
                        disabled={isSearching || !searchTerm.trim()}
                        className="px-4 py-3 flex-row items-center gap-2 justify-center"
                      >
                        {isSearching ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="search" size={16} color="white" />
                            <GaretText className="text-white font-semibold">Search</GaretText>
                          </>
                        )}
                      </Pressable>
                    </LinearGradient>
                  </View>

                  {/* Song Requests Dropdown */}
                  <View>
                    <Pressable
                      onPress={() => setIsRequestDropdownOpen(!isRequestDropdownOpen)}
                      className="border border-gray-300 rounded-md px-4 py-3 flex-row items-center justify-between shadow-md active:bg-gray-50"
                    >
                      <GaretText className="text-sm font-semibold">Song Requests</GaretText>
                      <View className="flex-row items-center gap-2">
                        {songRequests.length > 0 && (
                          <View className="bg-violet-500 rounded-full h-5 w-5 items-center justify-center">
                            <GaretText className="text-white text-xs font-bold">
                              {songRequests.length}
                            </GaretText>
                          </View>
                        )}
                        <Ionicons
                          name={isRequestDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#374151"
                        />
                      </View>
                    </Pressable>

                    {/* Dropdown Content */}
                    {isRequestDropdownOpen && (
                      <View className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {songRequests.length === 0 ? (
                          <View className="p-4">
                            <GaretText className="text-sm text-gray-500 text-center">
                              No song requests yet
                            </GaretText>
                          </View>
                        ) : (
                          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
                            {songRequests.map((request, index) => (
                              <View
                                key={index}
                                className="p-3 flex-row items-center gap-3 border-b border-gray-200"
                              >
                                {request.albumCover && (
                                  <Image
                                    source={{ uri: request.albumCover }}
                                    className="w-10 h-10 rounded"
                                    style={{ width: 40, height: 40 }}
                                  />
                                )}
                                <View className="flex-1">
                                  <GaretText className="text-sm font-medium">
                                    {request.title}
                                  </GaretText>
                                  <GaretText className="text-xs text-gray-500">
                                    {request.artist}
                                  </GaretText>
                                  {request.requestCount > 1 && (
                                    <GaretText className="text-xs text-violet-600 font-semibold">
                                      Requested {request.requestCount}x
                                    </GaretText>
                                  )}
                                </View>
                                <LinearGradient
                                  colors={['#c084fc', '#d8b4fe']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={{ borderRadius: 6 }}
                                >
                                  <Pressable
                                    onPress={() => acceptSongRequest(request)}
                                    className="px-3 py-2"
                                  >
                                    <GaretText className="text-white text-xs font-semibold">
                                      Accept
                                    </GaretText>
                                  </Pressable>
                                </LinearGradient>
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <View>
                      {searchResults.map((result, index) => (
                        <Pressable
                          key={index}
                          onPress={() => handleSelectSong(result)}
                          className="p-4 rounded-md mb-1"
                          style={({ pressed }) => ({
                            backgroundColor: pressed ? '#c4b5fd' : 'transparent',
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
                    className="w-8 h-8 border border-gray-300 rounded items-center justify-center active:bg-gray-100"
                  >
                    <Ionicons name="remove" size={16} color="#374151" />
                  </Pressable>
                  <Pressable
                    onPress={increaseFontSize}
                    className="w-8 h-8 border border-gray-300 rounded items-center justify-center active:bg-gray-100"
                  >
                    <Ionicons name="add" size={16} color="#374151" />
                  </Pressable>
                </View>
              </View>

              {/* Lyrics Display */}
              <Animated.View
                className="rounded-lg p-4 bg-gray-50"
                style={{
                  minHeight: 600,
                  opacity: isSearching || isFetchingLyrics ? pulseAnim : 1,
                }}
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
                    style={{
                      fontSize,
                      lineHeight: fontSize * 1.8,
                    }}
                    className="text-gray-900"
                  >
                    {lyrics || 'Waiting for the Host to select a song...'}
                  </GaretText>
                )}
              </Animated.View>
            </View>
          </View>

          {/* Share Button */}
          <Pressable
            onPress={() => setIsShareModalVisible(true)}
            className="mt-6 bg-violet-300 px-4 py-3 rounded-md flex-row items-center justify-center gap-2 shadow-lg active:bg-violet-400"
          >
            <Ionicons name="share-social" size={16} color="white" />
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
