import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  AppState,
  AppStateStatus,
  Text,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  Plus,
  Minus,
  ChevronDown,
  Mic,
  Share2,
  Users,
} from "lucide-react-native";
import { RocaText, GaretText } from "@/components/ui/Typography";
import { Input } from "@/components/ui/Input";
import { ShareModal } from "@/components/ShareModal";
import { MusicLoader } from "@/components/ui/MusicLoader";
import { storage } from "@/services/storage";
import { usePusher } from "@/hooks/usePusher";
import { api } from "@/services/api";
import type { RootStackParamList } from "@/types";
import { useTheme } from "@/context/ThemeContext";

import iconDark from "../assets/iconDark.png";

// const iconDark = require('@/assets/iconDark.png')

type GroupScreenRouteProp = RouteProp<RootStackParamList, "Group">;

interface SearchResult {
  display?: string;
  artist: string; // Backend returns artist as string, not object
  title: string;
  album: {
    cover?: string;
    cover_medium: string;
  };
}

interface SongRequest {
  title: string;
  artist: string;
  albumCover: string;
  timestamp: number;
  requestCount: number;
}

export default function GroupScreen() {
  const route = useRoute<GroupScreenRouteProp>();
  const navigation = useNavigation();
  const { id: groupId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pusher state
  const [lyrics, setLyrics] = useState("");
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [albumCover, setAlbumCover] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  // Song search state (for hosts)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  // Singer search state (for non-hosts)
  const [singerSearchTerm, setSingerSearchTerm] = useState("");
  const [singerSearchResults, setSingerSearchResults] = useState<
    SearchResult[]
  >([]);
  const [isSingerSearching, setIsSingerSearching] = useState(false);

  // Song requests state (for hosts)
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [isRequestDropdownOpen, setIsRequestDropdownOpen] = useState(false);

  // Share modal state
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const hostStatus = await storage.getIsHost();
      setIsHost(hostStatus);
    } catch (error) {
      console.error("Error loading role:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pusher event handlers (based on web app)
  const handleLyricUpdate = useCallback(
    (data: any) => {
      console.log("Received lyric update:", data);
      setLyrics(data.lyrics);
      setCurrentSong(data.title);
      setCurrentArtist(data.artist);
      if (data.albumCover) {
        setAlbumCover(data.albumCover);
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
        );
      }
    },
    [isHost]
  );

  const handleNewUserJoined = useCallback(async () => {
    console.log("Host received new-user-joined event");
    if (isHost && lyrics && currentSong) {
      try {
        await api.triggerPusherEvent(
          `group-lyrics-${groupId}`,
          "lyric-update",
          {
            title: currentSong,
            artist: currentArtist,
            lyrics: lyrics,
            albumCover,
          }
        );
      } catch (error) {
        console.error("Error re-broadcasting lyrics:", error);
      }
    }
  }, [isHost, lyrics, currentSong, currentArtist, albumCover, groupId]);

  const handleSubscriptionSucceeded = useCallback(async () => {
    // When a new user joins, request current lyrics
    if (!isHost) {
      console.log("New user subscription succeeded, requesting lyrics");
      try {
        await api.triggerPusherEvent(
          `group-lyrics-${groupId}`,
          "new-user-joined",
          {
            timestamp: Date.now(),
          }
        );
      } catch (error) {
        console.error("Error requesting lyrics:", error);
      }
    }
  }, [isHost, groupId]);

  // Handle host disconnect - notify all members
  const handleHostDisconnect = useCallback(async () => {
    if (!isHost) return;

    try {
      console.log("Host is disconnecting");
      await api.triggerPusherEvent(
        `group-lyrics-${groupId}`,
        "host-disconnect",
        {
          message: "Host has ended the session",
        }
      );
    } catch (error) {
      console.error("Error sending host disconnect message:", error);
    }
  }, [isHost, groupId]);

  // Handle receiving host disconnect event (for non-hosts)
  const handleHostDisconnectReceived = useCallback(() => {
    Alert.alert(
      "Session Ended",
      "The host has ended the session",
      [
        {
          text: "OK",
          onPress: async () => {
            await storage.clearAll();
            navigation.goBack();
          },
        },
      ],
      { cancelable: false }
    );
  }, [navigation]);

  // Handle song request (for hosts)
  const handleSongRequest = useCallback(
    (data: {
      title: string;
      artist: string;
      albumCover: string;
      timestamp: number;
    }) => {
      if (!isHost) return;

      console.log("Received song request:", data);

      setSongRequests((prevRequests) => {
        const existingIndex = prevRequests.findIndex(
          (req) =>
            req.title.toLowerCase() === data.title.toLowerCase() &&
            req.artist.toLowerCase() === data.artist.toLowerCase()
        );

        if (existingIndex !== -1) {
          // Merge duplicate - increment request count
          const updated = [...prevRequests];
          updated[existingIndex] = {
            ...updated[existingIndex],
            requestCount: updated[existingIndex].requestCount + 1,
          };
          return updated;
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
          ];
        }
      });
    },
    [isHost]
  );

  // Initialize Pusher connection
  usePusher(groupId, {
    onLyricUpdate: handleLyricUpdate,
    onNewUserJoined: handleNewUserJoined,
    onSubscriptionCount: setMemberCount,
    onSubscriptionSucceeded: handleSubscriptionSucceeded,
    onHostDisconnect: handleHostDisconnectReceived,
    onSongRequest: handleSongRequest,
  });

  // Handle app state changes for host disconnect
  useEffect(() => {
    if (!isHost) return;

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        // If host is backgrounding or quitting the app
        if (nextAppState === "background" || nextAppState === "inactive") {
          handleHostDisconnect();
        }
      }
    );

    // Cleanup on unmount - notify users that host is leaving
    return () => {
      subscription.remove();
      handleHostDisconnect();
    };
  }, [isHost, handleHostDisconnect]);

  const handleLeaveGroup = async () => {
    if (isHost) {
      await handleHostDisconnect();
    }
    await storage.clearAll();
    navigation.goBack();
  };

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 10));

  // Search for songs (Deezer) - Host
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      console.log("Searching for:", searchTerm);
      const results = await api.searchSongs(searchTerm);
      console.log("Search results:", results);
      console.log("Number of results:", results.length);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching songs:", error);
      Alert.alert(
        "Search Error",
        "Unable to search for songs. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Search for songs (Deezer) - Singer
  const searchSongAsSinger = async () => {
    if (!singerSearchTerm.trim()) return;

    setIsSingerSearching(true);
    try {
      console.log("Singer searching for:", singerSearchTerm);
      const results = await api.searchSongs(singerSearchTerm);
      console.log("Singer search results:", results);
      setSingerSearchResults(results);
    } catch (error) {
      console.error("Error searching songs for singer:", error);
      Alert.alert("Search Error", "Failed to search songs. Please try again.");
    } finally {
      setIsSingerSearching(false);
    }
  };

  // Request a song (Singer -> Host)
  const requestSong = async (
    title: string,
    artist: string,
    albumCover: string
  ) => {
    try {
      setSingerSearchResults([]);
      setSingerSearchTerm("");

      await api.triggerPusherEvent(`group-lyrics-${groupId}`, "song-request", {
        title,
        artist,
        albumCover,
        timestamp: Date.now(),
      });

      Alert.alert(
        "Request Sent!",
        `"${title}" by ${artist} has been requested.`
      );
    } catch (error) {
      console.error("Error requesting song:", error);
      Alert.alert(
        "Request Failed",
        "Failed to send song request. Please try again."
      );
    }
  };

  // Accept a song request (Host)
  const acceptSongRequest = async (request: SongRequest) => {
    console.log("Host accepting song request:", request);
    setIsRequestDropdownOpen(false);
    await handleSelectSong({
      title: request.title,
      artist: request.artist,
      album: { cover_medium: request.albumCover },
    } as SearchResult);
  };

  // Select a song and fetch/broadcast lyrics
  const handleSelectSong = async (song: SearchResult) => {
    setIsFetchingLyrics(true);
    setSearchResults([]); // Clear search results immediately

    try {
      // Fetch lyrics
      const fetchedLyrics = await api.fetchLyrics(song.artist, song.title);

      // Update local state
      setLyrics(fetchedLyrics);
      setCurrentSong(song.title);
      setCurrentArtist(song.artist);
      setAlbumCover(song.album.cover_medium);

      // Broadcast to all users via Pusher
      await api.triggerPusherEvent(`group-lyrics-${groupId}`, "lyric-update", {
        title: song.title,
        artist: song.artist,
        lyrics: fetchedLyrics,
        albumCover: song.album.cover_medium,
      });

      setSearchTerm("");
    } catch (error) {
      console.error("Error selecting song:", error);
      Alert.alert(
        "No Lyrics Found",
        "No lyrics found for this song. Please try another song or reach out to the developer."
      );
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center">
          <MusicLoader size="large" color="#C4B4FD" />
          <GaretText className="mt-4" style={{ color: colors.mutedForeground }}>
            Loading...
          </GaretText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["bottom"]}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.background }}>
          {/* Main Content Container */}
          {/* Header with Gradient Background */}
          <LinearGradient
            colors={["#A68BF7", "#C4B4FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-6 pb-8"
            style={{
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom - 16,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2 ml-2">
                <Image
                  source={iconDark}
                  style={{ width: 25, height: 25 }}
                  resizeMode="contain"
                />
                <RocaText className="text-2xl text-white font-bold">
                  Group Sing Along
                </RocaText>
              </View>
              <Pressable
                onPress={() => setIsShareModalVisible(true)}
                className="px-4 py-2 rounded-md flex-row items-center gap-1.5 mr-6"
                style={{
                  borderRadius: 6,
                  backgroundColor: "#C4B4FD",
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 3,
                    },
                  }),
                }}
              >
                <Users size={16} color="white" />
                <GaretText className="text-white text-md font-bold shadow-lg">
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </GaretText>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Info Rows */}
          <View
            className="px-6 py-4 flex-row items-center justify-between"
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: colors.card,
            }}
          >
            <GaretText
              className="text-lg font-medium"
              style={{ color: colors.foreground }}
            >
              Role:{" "}
              <GaretText className="font-semibold">
                {isHost ? "Host" : "Singer"}
              </GaretText>
            </GaretText>
            <GaretText
              className="text-lg font-medium"
              style={{ color: colors.foreground }}
            >
              Group Code:{" "}
              <GaretText className="font-semibold">{groupId}</GaretText>
            </GaretText>
          </View>

          {/* Singer Search Section */}
          {!isHost && (
            <View className="bg-white px-3">
              <View className="flex-row gap-2">
                <View className="">
                  <Input
                    placeholder="Search for a song"
                    value={singerSearchTerm}
                    onChangeText={setSingerSearchTerm}
                    editable={!isSingerSearching}
                    returnKeyType="search"
                    onSubmitEditing={searchSongAsSinger}
                    className="bg-white"
                    textAlign="center"
                    textAlignVertical="center"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e5e7eb",
                      borderWidth: 1,
                      borderRadius: 8,
                      height: 48,
                      // fontSize: 16,
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <LinearGradient
                  colors={["#A68BF7", "#C4B4FD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 6,
                    height: 48,
                    opacity:
                      isSingerSearching || !singerSearchTerm.trim() ? 0.5 : 1,
                  }}
                >
                  <Pressable
                    onPress={searchSongAsSinger}
                    disabled={isSingerSearching || !singerSearchTerm.trim()}
                    className="px-4 flex-row items-center gap-2 justify-center"
                    style={{ height: 48 }}
                  >
                    {isSingerSearching ? (
                      <MusicLoader size="small" color="white" />
                    ) : (
                      <>
                        <Search size={16} color="white" />
                        <GaretText className="text-white font-semibold shadow-lg">
                          Search
                        </GaretText>
                      </>
                    )}
                  </Pressable>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Singer Search Results */}
          {!isHost && singerSearchResults.length > 0 && (
            <View className="bg-white px-1 pb-4">
              <View className="bg-gray-50 rounded-lg border border-gray-200 max-h-64">
                <ScrollView showsVerticalScrollIndicator={false}>
                  {singerSearchResults.map((result, index) => (
                    <View
                      key={index}
                      className="p-3 flex-row items-center justify-between border-b border-gray-200"
                    >
                      <GaretText className="text-sm flex-1">
                        {result.display || `${result.title} - ${result.artist}`}
                      </GaretText>
                      <Pressable
                        onPress={() =>
                          requestSong(
                            result.title,
                            result.artist,
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
            </View>
          )}

          {/* Host Search Section */}
          {isHost && (
            <View className="bg-white px-6 py-4">
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    placeholder="Search for a song"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    editable={!isSearching}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                    className="bg-white"
                    textAlign="center"
                    textAlignVertical="center"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e5e7eb",
                      borderWidth: 1,
                      borderRadius: 8,
                      height: 48,
                      // fontSize: 16,
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <LinearGradient
                  colors={["#A68BF7", "#C4B4FD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 6,
                    height: 48,
                    opacity: isSearching || !searchTerm.trim() ? 0.5 : 1,
                  }}
                >
                  <Pressable
                    onPress={handleSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    className="px-4 flex-row items-center gap-2 justify-center"
                    style={{ height: 48 }}
                  >
                    {isSearching ? (
                      <MusicLoader size="small" color="white" />
                    ) : (
                      <>
                        <Search size={16} color="white" />
                        <GaretText className="text-white font-semibold">
                          Search
                        </GaretText>
                      </>
                    )}
                  </Pressable>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Host Search Results */}
          {isHost && searchResults.length > 0 && (
            <View className="bg-white px-6 pb-4">
              {searchResults.map((result, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelectSong(result)}
                  className="p-4 rounded-md mb-1"
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#c4b5fd" : "transparent",
                  })}
                >
                  <GaretText className="text-base text-gray-900">
                    {result.display || `${result.title} - ${result.artist}`}
                  </GaretText>
                </Pressable>
              ))}
            </View>
          )}

          {/* Host Song Requests Dropdown */}
          {isHost && (
            <View className="bg-white px-6 py-4">
              <Pressable
                onPress={() => setIsRequestDropdownOpen(!isRequestDropdownOpen)}
                className="border border-gray-200 px-4 py-3 flex-row items-center justify-between"
                style={{ borderRadius: 8 }}
              >
                <GaretText className="text-sm font-semibold text-gray-700">
                  Song Requests
                </GaretText>
                <View className="flex-row items-center gap-2">
                  {songRequests.length > 0 && (
                    <View className="bg-violet-500 rounded-full h-5 w-5 items-center justify-center">
                      <GaretText className="text-white text-xs font-bold">
                        {songRequests.length}
                      </GaretText>
                    </View>
                  )}
                  <ChevronDown
                    size={16}
                    color="#374151"
                    style={{
                      transform: [
                        {
                          rotate: isRequestDropdownOpen ? "180deg" : "0deg",
                        },
                      ],
                    }}
                  />
                </View>
              </Pressable>

              {/* Dropdown Content */}
              {isRequestDropdownOpen && (
                <View className="mt-2 bg-white" style={{ borderRadius: 8 }}>
                  {songRequests.length === 0 ? (
                    <View className="p-4">
                      <GaretText className="text-sm text-gray-500 text-center">
                        No song requests yet
                      </GaretText>
                    </View>
                  ) : (
                    <ScrollView
                      className="max-h-80"
                      showsVerticalScrollIndicator={false}
                    >
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
                            colors={["#A68BF7", "#C4B4FD"]}
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
          )}

          {/* Lyrics Section */}
          <View className="bg-white px-6 py-4 pb-6">
            {/* Lyrics Header with Font Controls */}
            <View className="flex-row items-center justify-between mb-3">
              <GaretText className="text-base font-semibold text-gray-900">
                Lyrics:
              </GaretText>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={decreaseFontSize}
                  className="w-8 h-8 border border-gray-300 rounded items-center justify-center active:bg-gray-100"
                >
                  <Minus size={16} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={increaseFontSize}
                  className="w-8 h-8 border border-gray-300 rounded items-center justify-center active:bg-gray-100"
                >
                  <Plus size={16} color="#374151" />
                </Pressable>
              </View>
            </View>

            {/* Current Song Display */}
            {currentSong && (
              <View className="flex-row items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                {albumCover && (
                  <Image
                    source={{ uri: albumCover }}
                    className="w-12 h-12 rounded-lg"
                    style={{ width: 50, height: 50 }}
                  />
                )}
                <View className="flex-1">
                  <GaretText className="text-lg font-semibold text-gray-900">
                    {currentSong}
                  </GaretText>
                  <GaretText className="text-sm text-gray-500">
                    {currentArtist}
                  </GaretText>
                </View>
              </View>
            )}

            {/* Lyrics Display */}
            <View
              className="p-4"
              style={{
                minHeight: 400,
              }}
            >
              {isSearching ? (
                <View className="flex-1 items-center justify-center">
                  <MusicLoader size="large" color="#A68BF7" />
                  <GaretText className="text-gray-400 mt-4">
                    Searching for songs...
                  </GaretText>
                </View>
              ) : isFetchingLyrics ? (
                <View className="flex-1 items-center justify-center">
                  <MusicLoader size="large" color="#A68BF7" />

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
                  {lyrics || "Waiting for the Host to select a song..."}
                </GaretText>
              )}
            </View>
          </View>

          {/* Share Button */}
          <Pressable
            onPress={() => setIsShareModalVisible(true)}
            className="mx-6 mt-6 bg-violet-300 px-4 py-3 rounded-lg flex-row items-center justify-center gap-2 shadow-lg active:bg-violet-400"
          >
            <Share2 size={16} color="white" />
            <GaretText className="text-white font-semibold">Share</GaretText>
          </Pressable>

          {/* Leave Group Button */}
          <Pressable
            onPress={handleLeaveGroup}
            className="mx-6 my-6 mb-12 border border-violet-300 px-4 py-3 rounded-lg items-center active:bg-gray-100"
          >
            <GaretText className="text-violet-400 font-semibold">
              Leave Group
            </GaretText>
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
  );
}
