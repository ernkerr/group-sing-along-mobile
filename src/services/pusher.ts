import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null

/**
 * Initialize Pusher client
 * Creates a singleton instance to avoid multiple connections
 */
export const initPusher = (): Pusher => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.EXPO_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
    })
    console.log('Pusher initialized')
  }
  return pusherInstance
}
