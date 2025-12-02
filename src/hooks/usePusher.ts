import { useEffect, useRef } from 'react'
import type { Channel } from 'pusher-js'
import { initPusher } from '@/services/pusher'

interface LyricUpdateData {
  lyrics: string
  title: string
  artist: string
  albumCover?: string
}

interface UsePusherCallbacks {
  onLyricUpdate?: (data: LyricUpdateData) => void
  onNewUserJoined?: () => void
  onSubscriptionCount?: (count: number) => void
  onSubscriptionSucceeded?: () => void
  onHostDisconnect?: () => void
}

/**
 * Custom hook to manage Pusher channel subscriptions
 * Based on the web app's implementation pattern
 */
export const usePusher = (
  groupId: string,
  callbacks: UsePusherCallbacks = {}
) => {
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    if (!groupId) return

    // Initialize Pusher and subscribe to channel
    const pusher = initPusher()
    const channelName = `group-lyrics-${groupId}`
    channelRef.current = pusher.subscribe(channelName)

    console.log('Subscribed to Pusher channel:', channelName)

    // Bind to lyric-update event
    if (callbacks.onLyricUpdate) {
      channelRef.current.bind('lyric-update', callbacks.onLyricUpdate)
    }

    // Bind to new-user-joined event
    if (callbacks.onNewUserJoined) {
      channelRef.current.bind('new-user-joined', callbacks.onNewUserJoined)
    }

    // Bind to subscription count updates
    if (callbacks.onSubscriptionCount) {
      channelRef.current.bind(
        'pusher:subscription_count',
        (data: { subscription_count: number }) => {
          console.log('Subscription count:', data.subscription_count)
          callbacks.onSubscriptionCount?.(data.subscription_count)
        }
      )
    }

    // Bind to subscription succeeded (for new users)
    if (callbacks.onSubscriptionSucceeded) {
      channelRef.current.bind(
        'pusher:subscription_succeeded',
        callbacks.onSubscriptionSucceeded
      )
    }

    // Bind to host disconnect event
    if (callbacks.onHostDisconnect) {
      channelRef.current.bind('host-disconnect', callbacks.onHostDisconnect)
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
  }, [
    groupId,
    callbacks.onLyricUpdate,
    callbacks.onNewUserJoined,
    callbacks.onHostDisconnect,
  ])

  return channelRef.current
}

export type { LyricUpdateData, UsePusherCallbacks }
