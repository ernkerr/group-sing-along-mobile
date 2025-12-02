import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RocaText, GaretText } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
      // Show error to user
      alert(`Search failed: ${error}`)
    } finally {
      setIsSearching(false)
    }
  }

  // Select a song and fetch/broadcast lyrics
  const handleSelectSong = async (song: any) => {
    setIsFetchingLyrics(true)
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

      // Clear search results
      setSearchResults([])
      setSearchTerm('')
    } catch (error) {
      console.error('Error selecting song:', error)
      // TODO: Show error message to user
    } finally {
      setIsFetchingLyrics(false)
    }
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

        {/* Lyrics Display / Song Search */}
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
          ) : isHost ? (
            <View className="flex-1">
              {/* Song Search for Host */}
              <GaretText className="text-lg font-semibold text-gray-900 mb-4">
                Search for a Song
              </GaretText>

              {/* Search Input */}
              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Input
                    placeholder="Search songs..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    editable={!isSearching}
                  />
                </View>
                <Button
                  onPress={handleSearch}
                  loading={isSearching}
                  disabled={!searchTerm.trim()}
                >
                  Search
                </Button>
              </View>

              {/* Search Results */}
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isFetchingLyrics ? (
                  <View className="items-center justify-center py-8">
                    <GaretText className="text-gray-600">Fetching lyrics...</GaretText>
                  </View>
                ) : searchResults.length > 0 ? (
                  searchResults.map((song, index) => (
                    <Button
                      key={song.id || index}
                      onPress={() => handleSelectSong(song)}
                      variant="outline"
                      className="mb-2 h-auto py-3 justify-start"
                    >
                      <View className="flex-row items-center gap-3 w-full">
                        <View className="w-12 h-12 bg-gray-200 rounded" />
                        <View className="flex-1">
                          <GaretText className="text-sm font-semibold text-gray-900 text-left">
                            {song.title}
                          </GaretText>
                          <GaretText className="text-xs text-gray-600 text-left">
                            {song.artist.name}
                          </GaretText>
                        </View>
                      </View>
                    </Button>
                  ))
                ) : searchResults.length === 0 && searchTerm ? (
                  <View className="items-center justify-center py-8">
                    <GaretText className="text-gray-500 text-center">
                      No results found for "{searchTerm}"
                    </GaretText>
                  </View>
                ) : (
                  <View className="items-center justify-center py-8">
                    <GaretText className="text-gray-500 text-center">
                      {isSearching ? 'Searching...' : 'Search for a song to get started'}
                    </GaretText>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <GaretText className="text-gray-500 text-center">
                Waiting for the host to select a song...
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
