const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

interface DeezerTrack {
  id?: number
  title: string
  artist: string // Backend returns artist as string, not object
  display?: string
  album: {
    title?: string
    cover?: string
    cover_medium: string
  }
  duration?: number
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
   * Search for songs directly via Deezer API
   * Calls: GET https://api.deezer.com/search?q={query}
   * Much faster than going through backend proxy
   */
  searchSongs: async (query: string): Promise<DeezerTrack[]> => {
    try {
      const response = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      // Deezer API returns { data: [...] }
      // Transform the response to ensure artist is a string
      const tracks = (result.data || []).map((track: any) => ({
        ...track,
        artist: typeof track.artist === 'object' ? track.artist.name : track.artist,
      }))

      return tracks
    } catch (error) {
      console.error('Error searching songs:', error)
      throw error
    }
  },

  /**
   * Fetch lyrics with multi-tier fallback system
   * 1. Try lyrics.ovh API (primary, usually fast and reliable)
   * 2. Fall back to LRCLib API (free backup)
   * Cleans song titles (removes "Remastered", "Live", etc.) for better matches
   */
  fetchLyrics: async (artist: string, title: string): Promise<string> => {
    // Validate inputs and ensure they're strings
    if (!title || !artist) {
      throw new Error(`Invalid song data: title="${title}", artist="${artist}"`)
    }

    // Convert to string in case we receive an object (defensive programming)
    const artistStr = typeof artist === 'object' ? (artist as any).name || String(artist) : String(artist)
    const titleStr = String(title)

    // Clean title and artist before sending (remove common suffixes/prefixes)
    const cleanedTitle = titleStr
      .replace(/\s*\(.*?(Remaster|Remix|Live|Acoustic|Radio Edit|Album Version|Single Version).*?\)/gi, '')
      .replace(/\s*-\s*(Remaster|Remix|Live|Acoustic|Radio Edit|Album Version|Single Version).*/gi, '')
      .trim()

    const cleanedArtist = artistStr
      .replace(/\s*\(.*?\)/g, '') // Remove anything in parentheses
      .trim()

    // Helper function to fetch with timeout
    const fetchWithTimeout = async (url: string, timeoutMs: number) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    // Try lyrics.ovh first (primary source)
    try {
      console.log('Trying lyrics.ovh API...')
      const lyricsOvhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanedArtist)}/${encodeURIComponent(cleanedTitle)}`

      const response = await fetchWithTimeout(lyricsOvhUrl, 3000)

      if (response.ok) {
        const data: LyricsResponse = await response.json()
        if (data.lyrics) {
          console.log('✓ Lyrics found via lyrics.ovh')
          return data.lyrics
        }
      }
      console.log('lyrics.ovh did not return lyrics, trying fallback...')
    } catch (error) {
      console.log('lyrics.ovh failed, trying fallback...', error)
    }

    // Fall back to LRCLib
    try {
      console.log('Trying LRCLib API...')
      const lrcLibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanedArtist)}&track_name=${encodeURIComponent(cleanedTitle)}`

      const response = await fetchWithTimeout(lrcLibUrl, 3000)

      if (response.ok) {
        const data = await response.json()
        if (data.plainLyrics) {
          console.log('✓ Lyrics found via LRCLib')
          return data.plainLyrics
        }
      }
      console.log('LRCLib did not return lyrics, trying final fallback...')
    } catch (error) {
      console.log('LRCLib failed, trying final fallback...', error)
    }

    // Final fallback to backend (may have caching or additional sources)
    try {
      console.log('Trying backend API (final fallback)...')
      const backendUrl = `${API_BASE_URL}/api/lyrics?artist=${encodeURIComponent(cleanedArtist)}&title=${encodeURIComponent(cleanedTitle)}`

      const response = await fetchWithTimeout(backendUrl, 3000)

      if (response.ok) {
        const data: LyricsResponse = await response.json()
        if (data.lyrics) {
          console.log('✓ Lyrics found via backend')
          return data.lyrics
        }
      }
    } catch (error) {
      console.error('All lyrics services failed:', error)
      throw new Error('Lyrics not found - no service could find this song')
    }

    throw new Error('Lyrics not found - no service could find this song')
  },
}

// Export types for use in components
export type { DeezerTrack, LyricsResponse }
