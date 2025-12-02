const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

interface PusherEventData {
  channel: string
  event: string
  data: any
}

interface DeezerTrack {
  id: number
  title: string
  artist: {
    name: string
  }
  album: {
    title: string
    cover_medium: string
  }
  duration: number
}

interface LyricsResponse {
  lyrics: string
}

/**
 * API service for communicating with the Next.js backend
 */
export const api = {
  /**
   * Trigger a Pusher event via the Next.js backend
   * Calls: POST /api/pusher
   */
  triggerPusherEvent: async (
    channel: string,
    event: string,
    data: any
  ): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pusher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, event, data }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error triggering Pusher event:', error)
      throw error
    }
  },

  /**
   * Search for songs via Deezer API through Next.js proxy
   * Calls: GET /api/proxy?query=...
   * Returns array of tracks directly (not wrapped in data property)
   */
  searchSongs: async (query: string): Promise<DeezerTrack[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/proxy?query=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Raw API response:', result)

      // Backend returns the array directly, not wrapped
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('Error searching songs:', error)
      throw error
    }
  },

  /**
   * Fetch lyrics for a song via backend proxy
   * Calls: GET /api/lyrics?artist=...&title=...
   * This fixes CORS issues and cleans song titles (removes "Remastered", "Live", etc.)
   */
  fetchLyrics: async (artist: string, title: string): Promise<string> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Lyrics not found')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const data: LyricsResponse = await response.json()
      return data.lyrics
    } catch (error) {
      console.error('Error fetching lyrics:', error)
      throw error
    }
  },
}

// Export types for use in components
export type { DeezerTrack, LyricsResponse }
