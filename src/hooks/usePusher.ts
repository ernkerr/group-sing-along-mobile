import { useEffect, useRef } from 'react'
import type { PresenceChannel } from 'pusher-js'
import { initPusher } from '@/services/pusher'

interface LyricUpdateData {
  lyrics: string
  title: string
  artist: string
  albumCover?: string
}

interface SongRequestData {
  title: string
  artist: string
  albumCover: string
  timestamp: number
}

interface UsePusherCallbacks {
  onLyricUpdate?: (data: LyricUpdateData) => void
  onNewUserJoined?: () => void
  onSubscriptionCount?: (count: number) => void
  onSubscriptionSucceeded?: () => void
  onHostDisconnect?: () => void
  onSongRequest?: (data: SongRequestData) => void
  onSessionExpired?: () => void
}

/**
 * Custom hook to manage Pusher channel subscriptions
 * Based on the web app's implementation pattern
 */
export const usePusher = (
  groupId: string,
  callbacks: UsePusherCallbacks = {}
) => {
  const channelRef = useRef<PresenceChannel | null>(null)

  useEffect(() => {
    if (!groupId) return

    // Initialize Pusher and subscribe to channel
    const pusher = initPusher()
    const channelName = `group-lyrics-${groupId}`
    channelRef.current = pusher.subscribe(channelName) as PresenceChannel

    console.log('Subscribed to Pusher channel:', channelName)

    // Bind to lyric-update event
    if (callbacks.onLyricUpdate) {
      channelRef.current.bind('lyric-update', callbacks.onLyricUpdate)
    }

    // Bind to new-user-joined event
    if (callbacks.onNewUserJoined) {
      channelRef.current.bind('new-user-joined', callbacks.onNewUserJoined)
    }

    // Bind to subscription succeeded event
    if (callbacks.onSubscriptionSucceeded) {
      channelRef.current.bind(
        'pusher:subscription_succeeded',
        callbacks.onSubscriptionSucceeded
      )
    }

    // Bind to Pusher's built-in subscription count event
    if (callbacks.onSubscriptionCount) {
      channelRef.current.bind(
        'pusher:subscription_count',
        (data: { subscription_count: number }) => {
          console.log('Subscription count:', data.subscription_count)
          callbacks.onSubscriptionCount?.(data.subscription_count)
        }
      )
    }

    // Bind to host disconnect event
    if (callbacks.onHostDisconnect) {
      channelRef.current.bind('host-disconnect', callbacks.onHostDisconnect)
    }

    // Bind to song request event
    if (callbacks.onSongRequest) {
      channelRef.current.bind('song-request', callbacks.onSongRequest)
    }

    // Bind to session expired event (for EVENT tier)
    if (callbacks.onSessionExpired) {
      channelRef.current.bind('session-expired', callbacks.onSessionExpired)
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        pusher.unsubscribe(channelName)
        channelRef.current = null
        console.log('Unsubscribed from Pusher channel:', channelName)
      }
    }
  }, [groupId]) // Only depend on groupId to prevent rebinding when callbacks change

  return channelRef.current
}

export type { LyricUpdateData, SongRequestData, UsePusherCallbacks }
