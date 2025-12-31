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
 * Uses refs to track callbacks so event bindings always call the latest version
 */
export const usePusher = (
  groupId: string,
  callbacks: UsePusherCallbacks = {}
) => {
  const channelRef = useRef<PresenceChannel | null>(null)

  // Use refs to always have access to the latest callbacks without rebinding
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!groupId) return

    // Initialize Pusher and subscribe to channel
    const pusher = initPusher()
    const channelName = `group-lyrics-${groupId}`
    channelRef.current = pusher.subscribe(channelName) as PresenceChannel

    console.log('Subscribed to Pusher channel:', channelName)

    // Bind to lyric-update event
    channelRef.current.bind('lyric-update', (data: LyricUpdateData) => {
      callbacksRef.current.onLyricUpdate?.(data)
    })

    // Bind to new-user-joined event
    channelRef.current.bind('new-user-joined', () => {
      callbacksRef.current.onNewUserJoined?.()
    })

    // Bind to subscription succeeded event
    channelRef.current.bind('pusher:subscription_succeeded', () => {
      callbacksRef.current.onSubscriptionSucceeded?.()
    })

    // Bind to Pusher's built-in subscription count event
    channelRef.current.bind(
      'pusher:subscription_count',
      (data: { subscription_count: number }) => {
        console.log('Subscription count:', data.subscription_count)
        callbacksRef.current.onSubscriptionCount?.(data.subscription_count)
      }
    )

    // Bind to host disconnect event
    channelRef.current.bind('host-disconnect', () => {
      callbacksRef.current.onHostDisconnect?.()
    })

    // Bind to song request event
    channelRef.current.bind('song-request', (data: SongRequestData) => {
      callbacksRef.current.onSongRequest?.(data)
    })

    // Bind to session expired event (for EVENT tier)
    channelRef.current.bind('session-expired', () => {
      callbacksRef.current.onSessionExpired?.()
    })

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        pusher.unsubscribe(channelName)
        channelRef.current = null
        console.log('Unsubscribed from Pusher channel:', channelName)
      }
    }
  }, [groupId])

  return channelRef.current
}

export type { LyricUpdateData, SongRequestData, UsePusherCallbacks }
