// Navigation types
export type RootStackParamList = {
  Landing: undefined
  Group: { id: string }
}

// Search result types
export interface SearchResult {
  display: string
  artist: string
  title: string
  album: string
}

// Pusher event data types
export interface LyricUpdateData {
  lyrics: string
  title: string
  artist: string
  albumCover?: string
}

export interface NewUserJoinedData {
  timestamp: number
}

export interface HostDisconnectData {
  message: string
}

export interface SubscriptionCountData {
  subscription_count: number
}
