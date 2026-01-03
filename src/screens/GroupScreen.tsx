import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  AppState,
  AppStateStatus,
  Platform,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
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
import { PaywallModal } from "@/components/PaywallModal";
import { SessionTimer } from "@/components/SessionTimer";
import { MusicLoader } from "@/components/ui/MusicLoader";
import { SongListItem } from "@/components/SongListItem";
import { SongRequestItem } from "@/components/SongRequestItem";
import { storage } from "@/services/storage";
import { usePusher } from "@/hooks/usePusher";
import { useSubscription } from "@/hooks/useSubscription";
import { useResponsive } from "@/hooks/useResponsive";
import { api } from "@/services/api";
import type { RootStackParamList } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { SubscriptionTier } from "@/types/subscription";
import { BRAND, GRADIENTS, GRAY } from "@/constants";

import iconDark from "../assets/iconDark.png";

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
  const {
    colors,
    fontScale,
    increaseFontSize,
    decreaseFontSize,
    getScaledSize,
  } = useTheme();
  const { isTablet, isDesktop } = useResponsive();
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pusher state
  const [lyrics, setLyrics] = useState("");
  const [currentSong, setCurrentSong] = useState("");
  const [currentArtist, setCurrentArtist] = useState("");
  const [albumCover, setAlbumCover] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [hostLimit, setHostLimit] = useState(3); // Host's member limit (received via Pusher)

  // Responsive content width
  const contentMaxWidth = isDesktop ? 800 : isTablet ? 640 : undefined;

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

  // Paywall modal state
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  // Limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<"host" | "singer">(
    "host"
  );

  // Subscription state
  const { tier, memberLimit, canInviteMore } = useSubscription();

  // Session expiry state (for EVENT tier 24-hour timer)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    loadRole();
    loadSessionInfo();
  }, []);

  const loadSessionInfo = async () => {
    try {
      const sessionInfo = await storage.getSessionInfo();
      if (sessionInfo?.expiresAt) {
        setSessionExpiresAt(sessionInfo.expiresAt);
      }
    } catch (error) {
      console.error("Error loading session info:", error);
    }
  };

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
      // Capture host's member limit for paywall enforcement
      if (data.hostLimit) {
        setHostLimit(data.hostLimit);
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
    if (isHost) {
      try {
        // Broadcast current lyrics AND host's member limit
        await api.triggerPusherEvent(
          `group-lyrics-${groupId}`,
          "lyric-update",
          {
            title: currentSong || "",
            artist: currentArtist || "",
            lyrics: lyrics || "",
            albumCover,
            hostLimit: memberLimit, // Include host's limit for paywall enforcement
          }
        );
      } catch (error) {
        console.error("Error re-broadcasting info:", error);
      }
    }
  }, [
    isHost,
    lyrics,
    currentSong,
    currentArtist,
    albumCover,
    groupId,
    memberLimit,
  ]);

  const handleSubscriptionSucceeded = useCallback(async () => {
    if (!isHost) {
      // Singer: request current lyrics from host
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

  // Paywall enforcement: kick singers if they join a full room
  // Uses hostLimit (received from host via Pusher) for singers
  useEffect(() => {
    // For singers, use the host's limit; for hosts, use their own limit
    const effectiveLimit = isHost ? memberLimit : hostLimit;

    // Debug logging
    console.log(
      `[PAYWALL CHECK] isHost: ${isHost}, memberCount: ${memberCount}, effectiveLimit: ${effectiveLimit}, hostLimit: ${hostLimit}`
    );

    // Only check for singers (not hosts) and only if we have a valid member count
    if (!isHost && memberCount > effectiveLimit && memberCount > 0) {
      console.log(
        `🚫 Room is full: ${memberCount}/${effectiveLimit} - KICKING USER`
      );

      // Use flag to prevent multiple kicks
      let hasKicked = false;
      const kickUser = async () => {
        if (hasKicked) return;
        hasKicked = true;
        console.log("Executing kickUser - clearing storage and going back");
        await storage.clearAll();
        navigation.goBack();
      };

      // Show alert - user tapping OK will kick
      Alert.alert(
        "Room Full",
        `This group has reached its ${effectiveLimit}-member capacity. Ask the host to upgrade to allow more members.`,
        [
          {
            text: "OK",
            onPress: kickUser,
          },
        ],
        { cancelable: false }
      );
    } else {
      console.log(`[PAYWALL CHECK] Not kicking - condition not met`);
    }
  }, [memberCount, memberLimit, hostLimit, isHost, navigation]);

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

  // Handle session expired event
  const handleSessionExpiredReceived = useCallback(() => {
    Alert.alert(
      "Session Expired",
      "This 24-hour session has ended.",
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

  // Initialize Pusher connection
  usePusher(groupId, {
    onLyricUpdate: handleLyricUpdate,
    onNewUserJoined: handleNewUserJoined,
    onSubscriptionCount: setMemberCount,
    onSubscriptionSucceeded: handleSubscriptionSucceeded,
    onHostDisconnect: handleHostDisconnectReceived,
    onSongRequest: handleSongRequest,
    onSessionExpired: handleSessionExpiredReceived,
  });

  // Real-time member limit enforcement (shows notification modal)
  useEffect(() => {
    // Use host's limit for singers, own limit for hosts
    const effectiveLimit = isHost ? memberLimit : hostLimit;

    // Only enforce if member count exceeds limit
    // Don't kick existing members, just show notification
    if (memberCount > effectiveLimit && memberCount > 0) {
      if (isHost) {
        // Show modal to host
        setLimitModalType("host");
        setShowLimitModal(true);
      }
      // Note: We don't auto-kick singers here - that's handled by the paywall enforcement effect
    }
  }, [memberCount, memberLimit, hostLimit, isHost]);

  // Handle app state changes for host disconnect
  // Use a delay to avoid false disconnects when host briefly backgrounds (screenshot, share, etc.)
  useEffect(() => {
    if (!isHost) return;

    let disconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const DISCONNECT_DELAY_MS = 10000; // 10 seconds grace period

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "background") {
          // Start a timer - only disconnect if host stays backgrounded
          disconnectTimer = setTimeout(() => {
            console.log("Host stayed in background, sending disconnect");
            handleHostDisconnect();
          }, DISCONNECT_DELAY_MS);
        } else if (nextAppState === "active") {
          // Host came back - cancel any pending disconnect
          if (disconnectTimer) {
            console.log("Host returned to app, canceling disconnect timer");
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
          }
        }
        // Note: "inactive" state is ignored - it's a transitional state
        // (e.g., notification center, share sheet, screenshot)
      }
    );

    // Cleanup on unmount - notify users that host is leaving
    return () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
      }
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

  // Check if group is in empty state (no content to show)
  const isEmptyState =
    !currentSong &&
    !lyrics &&
    searchResults.length === 0 &&
    singerSearchResults.length === 0;

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

      // Broadcast to all users via Pusher (including host's limit for paywall)
      await api.triggerPusherEvent(`group-lyrics-${groupId}`, "lyric-update", {
        title: song.title,
        artist: song.artist,
        lyrics: fetchedLyrics,
        albumCover: song.album.cover_medium,
        hostLimit: memberLimit,
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

  // Handle invite button press (for both member count and share buttons)
  const handleInvite = () => {
    if (isHost) {
      if (canInviteMore(memberCount)) {
        // Under limit: just show share modal
        setIsShareModalVisible(true);
      } else {
        // At limit: show share modal THEN paywall on top
        setIsShareModalVisible(true);
        // Small delay so share modal renders first
        setTimeout(() => setIsPaywallVisible(true), 100);
      }
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
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={isEmptyState ? { flexGrow: 1 } : undefined}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ backgroundColor: colors.background }}>
            {/* Main Content Container */}
            {/* Header with Gradient Background */}
            <View
              style={{
                width: "100%",
              }}
            >
              <LinearGradient
                colors={["#A68BF7", "#C4B4FD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: insets.top + 100,
                }}
              />
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingTop: insets.top + 8,
                  paddingBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Image
                      source={iconDark}
                      style={{ width: 25, height: 25 }}
                      resizeMode="contain"
                    />
                    <RocaText
                      style={{
                        fontSize: 24,
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      Group Sing Along
                    </RocaText>
                  </View>
                  <Pressable
                    onPress={handleInvite}
                    disabled={!isHost}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
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
                    <GaretText
                      style={{
                        color: "white",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </GaretText>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Info Rows */}
            <View
              className="px-6 py-4 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.card,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <GaretText
                className="font-medium"
                style={{
                  fontSize: getScaledSize(18),
                  color: colors.foreground,
                }}
              >
                Role:{" "}
                <GaretText className="font-semibold">
                  {isHost ? "Host" : "Singer"}
                </GaretText>
              </GaretText>
              <GaretText
                className="font-medium"
                style={{
                  fontSize: getScaledSize(18),
                  color: colors.foreground,
                }}
              >
                Group Code:{" "}
                <GaretText className="font-semibold">{groupId}</GaretText>
              </GaretText>
            </View>

            {/* EVENT Tier Timer Display */}
            {tier === SubscriptionTier.EVENT && isHost && sessionExpiresAt && (
              <SessionTimer
                sessionExpiresAt={sessionExpiresAt}
                groupId={groupId}
                onSessionExpired={handleSessionExpiredReceived}
              />
            )}

            {/* Singer Search Section */}
            {!isHost && (
              <View
                className="px-6 py-4"
                style={{ backgroundColor: colors.card }}
              >
                <View
                  className="flex-row gap-2"
                  style={{ alignItems: "stretch" }}
                >
                  <View className="flex-1">
                    <Input
                      placeholder="Search for a song"
                      value={singerSearchTerm}
                      onChangeText={setSingerSearchTerm}
                      editable={!isSingerSearching}
                      returnKeyType="search"
                      onSubmitEditing={searchSongAsSinger}
                      scale={true}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        height: 48,
                        fontSize: 16,
                        letterSpacing: 0,
                      }}
                    />
                  </View>
                  <LinearGradient
                    colors={["#A68BF7", "#C4B4FD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 8,
                      justifyContent: "center",
                      opacity:
                        isSingerSearching || !singerSearchTerm.trim() ? 0.5 : 1,
                    }}
                  >
                    <Pressable
                      onPress={searchSongAsSinger}
                      disabled={isSingerSearching || !singerSearchTerm.trim()}
                      className="flex-row items-center gap-2 justify-center"
                      style={{
                        paddingHorizontal: getScaledSize(16),
                        height: getScaledSize(48),
                      }}
                    >
                      {isSingerSearching ? (
                        <MusicLoader size="small" color="white" />
                      ) : (
                        <>
                          <Search size={getScaledSize(16)} color="white" />
                          <GaretText
                            className="text-white font-semibold"
                            style={{ fontSize: getScaledSize(14) }}
                          >
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
              <View
                className="px-6 pb-4"
                style={{ backgroundColor: colors.card }}
              >
                <View
                  className="rounded-lg max-h-64"
                  style={{
                    backgroundColor: GRAY[50],
                    borderWidth: 1,
                    borderColor: GRAY[200],
                  }}
                >
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {singerSearchResults.map((result, index) => (
                      <SongListItem
                        key={index}
                        title={result.title}
                        artist={result.artist}
                        display={result.display}
                        actionLabel="Request"
                        showDivider={index < singerSearchResults.length - 1}
                        scale={true}
                        onPress={() =>
                          requestSong(
                            result.title,
                            result.artist,
                            result.album.cover || result.album.cover_medium
                          )
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Host Search Section */}
            {isHost && (
              <View
                className="px-6 py-4"
                style={{ backgroundColor: colors.card }}
              >
                <View
                  className="flex-row gap-2"
                  style={{ alignItems: "stretch" }}
                >
                  <View className="flex-1">
                    <Input
                      placeholder="Search for a song"
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      editable={!isSearching}
                      returnKeyType="search"
                      onSubmitEditing={handleSearch}
                      scale={true}
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                        borderRadius: 8,
                        height: 48,
                        fontSize: 16,
                        letterSpacing: 0,
                      }}
                    />
                  </View>
                  <LinearGradient
                    colors={["#A68BF7", "#C4B4FD"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 8,
                      justifyContent: "center",
                      opacity: isSearching || !searchTerm.trim() ? 0.5 : 1,
                    }}
                  >
                    <Pressable
                      onPress={handleSearch}
                      disabled={isSearching || !searchTerm.trim()}
                      className="flex-row items-center gap-2 justify-center"
                      style={{
                        paddingHorizontal: getScaledSize(16),
                        height: getScaledSize(48),
                      }}
                    >
                      {isSearching ? (
                        <MusicLoader size="small" color="white" />
                      ) : (
                        <>
                          <Search size={getScaledSize(16)} color="white" />
                          <GaretText
                            className="text-white font-semibold"
                            style={{ fontSize: getScaledSize(14) }}
                          >
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
              <View
                className="px-6 pb-4"
                style={{ backgroundColor: colors.card }}
              >
                <View
                  className="rounded-lg"
                  style={{
                    backgroundColor: GRAY[50],
                    borderWidth: 1,
                    borderColor: GRAY[200],
                  }}
                >
                  {searchResults.map((result, index) => (
                    <SongListItem
                      key={index}
                      title={result.title}
                      artist={result.artist}
                      display={result.display}
                      actionLabel="Select"
                      showDivider={index < searchResults.length - 1}
                      scale={true}
                      onPress={() => handleSelectSong(result)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Host Song Requests Dropdown */}
            {isHost && (
              <View
                className="px-6 py-4"
                style={{ backgroundColor: colors.card }}
              >
                <Pressable
                  onPress={() =>
                    setIsRequestDropdownOpen(!isRequestDropdownOpen)
                  }
                  className="flex-row items-center justify-between"
                  style={{
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: GRAY[200],
                    paddingHorizontal: getScaledSize(16),
                    paddingVertical: getScaledSize(14),
                  }}
                >
                  <GaretText
                    className="font-semibold"
                    style={{ fontSize: getScaledSize(16), color: GRAY[700] }}
                  >
                    Song Requests
                  </GaretText>
                  <View className="flex-row items-center gap-2">
                    {songRequests.length > 0 && (
                      <View
                        className="rounded-full items-center justify-center"
                        style={{
                          backgroundColor: BRAND.primary,
                          width: getScaledSize(24),
                          height: getScaledSize(24),
                        }}
                      >
                        <GaretText
                          className="text-white font-bold"
                          style={{ fontSize: getScaledSize(12) }}
                        >
                          {songRequests.length}
                        </GaretText>
                      </View>
                    )}
                    <ChevronDown
                      size={getScaledSize(18)}
                      color={GRAY[700]}
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
                  <View
                    className="mt-2"
                    style={{ borderRadius: 8, backgroundColor: colors.card }}
                  >
                    {songRequests.length === 0 ? (
                      <View style={{ padding: getScaledSize(16) }}>
                        <GaretText
                          className="text-center"
                          style={{
                            fontSize: getScaledSize(14),
                            color: GRAY[500],
                          }}
                        >
                          No song requests yet
                        </GaretText>
                      </View>
                    ) : (
                      <ScrollView
                        className="max-h-80"
                        showsVerticalScrollIndicator={false}
                      >
                        {songRequests.map((request, index) => (
                          <SongRequestItem
                            key={index}
                            title={request.title}
                            artist={request.artist}
                            albumCover={request.albumCover}
                            requestCount={request.requestCount}
                            showDivider={index < songRequests.length - 1}
                            scale={true}
                            onAccept={() => acceptSongRequest(request)}
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Lyrics Section */}
            <View
              className="px-6 py-4 pb-6"
              style={{ backgroundColor: colors.card }}
            >
              {/* Lyrics Header with Font Controls */}
              <View className="flex-row items-center justify-between mb-3">
                <GaretText
                  className="font-semibold"
                  style={{
                    fontSize: getScaledSize(16),
                    color: colors.foreground,
                  }}
                >
                  Lyrics:
                </GaretText>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={decreaseFontSize}
                    className="items-center justify-center active:bg-gray-100"
                    style={{
                      width: getScaledSize(40),
                      height: getScaledSize(40),
                      borderWidth: 1,
                      borderColor: GRAY[300],
                      borderRadius: 8,
                    }}
                  >
                    <Minus size={getScaledSize(20)} color={GRAY[700]} />
                  </Pressable>
                  <Pressable
                    onPress={increaseFontSize}
                    className="items-center justify-center active:bg-gray-100"
                    style={{
                      width: getScaledSize(40),
                      height: getScaledSize(40),
                      borderWidth: 1,
                      borderColor: GRAY[300],
                      borderRadius: 8,
                    }}
                  >
                    <Plus size={getScaledSize(20)} color={GRAY[700]} />
                  </Pressable>
                </View>
              </View>

              {/* Current Song Display */}
              {currentSong && (
                <View
                  className="flex-row items-center gap-4 mb-4 pb-4"
                  style={{ borderBottomWidth: 1, borderBottomColor: GRAY[200] }}
                >
                  {albumCover && (
                    <Image
                      source={{ uri: albumCover }}
                      style={{
                        width: getScaledSize(80),
                        height: getScaledSize(80),
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <View className="flex-1">
                    <GaretText
                      className="font-semibold"
                      style={{
                        fontSize: getScaledSize(20),
                        color: colors.foreground,
                      }}
                    >
                      {currentSong}
                    </GaretText>
                    <GaretText
                      style={{ fontSize: getScaledSize(16), color: GRAY[500] }}
                    >
                      {currentArtist}
                    </GaretText>
                  </View>
                </View>
              )}

              {/* Lyrics Display */}
              <View
                className="p-4"
                style={{
                  minHeight: 350,
                }}
              >
                {isSearching ? (
                  <View className="flex-1 items-center justify-center">
                    <MusicLoader size="large" color={BRAND.primary} />
                    <GaretText
                      className="mt-4"
                      style={{ fontSize: getScaledSize(14), color: GRAY[400] }}
                    >
                      Searching for songs...
                    </GaretText>
                  </View>
                ) : isFetchingLyrics ? (
                  <View className="flex-1 items-center justify-center">
                    <MusicLoader size="large" color={BRAND.primary} />
                    <GaretText
                      className="mt-4"
                      style={{ fontSize: getScaledSize(14), color: GRAY[400] }}
                    >
                      Loading lyrics...
                    </GaretText>
                  </View>
                ) : (
                  <GaretText
                    style={{
                      fontSize: getScaledSize(16),
                      lineHeight: getScaledSize(16) * 1.8,
                      color: colors.foreground,
                    }}
                  >
                    {lyrics || "Waiting for the Host to select a song..."}
                  </GaretText>
                )}
              </View>
            </View>
          </View>

          {/* Share Button */}
          <Pressable
            onPress={handleInvite}
            disabled={!isHost}
            className="mx-6 mt-6 px-4 py-4 rounded-lg flex-row items-center justify-center gap-2 shadow-lg active:opacity-80"
            style={{ backgroundColor: BRAND.primaryLight }}
          >
            <Share2 size={getScaledSize(18)} color="white" />
            <GaretText
              className="text-white font-semibold"
              style={{ fontSize: getScaledSize(16) }}
            >
              {isHost ? "Share" : "Ask host to share"}
            </GaretText>
          </Pressable>

          {/* Leave Group Button */}
          <Pressable
            onPress={handleLeaveGroup}
            className="mx-6 mt-3 mb-6 px-4 py-4 rounded-lg items-center active:bg-gray-100"
            style={{ borderWidth: 1, borderColor: BRAND.primaryLight }}
          >
            <GaretText
              className="font-semibold"
              style={{ fontSize: getScaledSize(16), color: BRAND.accent }}
            >
              Leave Group
            </GaretText>
          </Pressable>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Share Modal */}
        <ShareModal
          isVisible={isShareModalVisible}
          onClose={() => setIsShareModalVisible(false)}
          groupId={groupId}
        />

        {/* Paywall Modal */}
        <PaywallModal
          visible={isPaywallVisible}
          onClose={() => setIsPaywallVisible(false)}
          currentMemberCount={memberCount}
          userRole={isHost ? "host" : "singer"}
        />

        {/* Member Limit Modal */}
        <Modal
          visible={showLimitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLimitModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <Pressable
              className="w-full max-w-lg rounded-2xl p-6"
              style={{ backgroundColor: colors.card }}
              onPress={(e) => e.stopPropagation()}
            >
              <RocaText
                className="text-xl font-semibold mb-4"
                style={{ color: colors.foreground }}
              >
                {limitModalType === "host"
                  ? "Member Limit Reached"
                  : "Room Full"}
              </RocaText>
              <GaretText
                className="text-base mb-6"
                style={{ color: colors.mutedForeground }}
              >
                {limitModalType === "host"
                  ? `Your ${tier} plan supports up to ${memberLimit} members. Upgrade to allow more.`
                  : "This room has reached its member limit. Ask the host to upgrade."}
              </GaretText>
              {limitModalType === "host" ? (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setShowLimitModal(false);
                      navigation.navigate("Pricing" as never);
                    }}
                    className="flex-1 bg-violet-400 py-3 rounded-lg items-center active:bg-violet-500"
                  >
                    <GaretText className="text-white font-semibold">
                      Upgrade
                    </GaretText>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowLimitModal(false)}
                    className="flex-1 py-3 rounded-lg items-center"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    <GaretText style={{ color: colors.foreground }}>
                      Dismiss
                    </GaretText>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowLimitModal(false)}
                  className="bg-violet-400 py-3 rounded-lg items-center active:bg-violet-500"
                >
                  <GaretText className="text-white font-semibold">OK</GaretText>
                </Pressable>
              )}
            </Pressable>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
