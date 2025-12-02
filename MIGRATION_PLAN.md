# Group Sing Along: Web to React Native Migration Plan

## Overview

Convert the Group Sing Along web app (Next.js + Tailwind + Pusher) to a native iOS mobile app using React Native with Expo, while maintaining the existing Next.js backend for API services.

**IMPORTANT:** This will be a **NEW repository** (not replacing the existing web app repo). The web app and mobile app will coexist as separate codebases, both sharing the same Next.js backend API.

**Key Decisions:**
- **Framework:** Expo (managed workflow)
- **Platform:** iOS only
- **Backend:** Keep existing Next.js API routes (web and mobile share same backend)
- **Styling:** NativeWind (Tailwind-like className syntax)
- **State:** Continue with useState hooks (no new state management)
- **Real-time:** Pusher.js (works in React Native without modification)

---

## 1. Project Setup

### Initial Setup Commands

```bash
# Create new Expo project with TypeScript
npx create-expo-app@latest group-sing-along-mobile --template blank-typescript

cd group-sing-along-mobile

# Install core dependencies
npx expo install react-native-safe-area-context react-native-screens

# Install navigation
npm install @react-navigation/native @react-navigation/native-stack

# Install NativeWind
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Install Pusher and API dependencies
npm install pusher-js

# Install platform-specific features
npm install react-native-qrcode-svg react-native-svg
npm install expo-font @expo/vector-icons
npm install @react-native-async-storage/async-storage

# Install UI utilities
npm install class-variance-authority clsx tailwind-merge
```

### Directory Structure

```
group-sing-along-mobile/
├── App.tsx                          # Root component
├── app.json                         # Expo configuration
├── tailwind.config.js               # NativeWind config
├── babel.config.js                  # Babel config with NativeWind
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Navigation setup
│   ├── screens/
│   │   ├── LandingScreen.tsx        # Home/landing page
│   │   └── GroupScreen.tsx          # Group session page
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx           # Button component
│   │   │   ├── Input.tsx            # Input component
│   │   │   ├── Card.tsx             # Card component
│   │   │   └── Modal.tsx            # Modal component
│   │   ├── ThemeIcon.tsx            # Microphone icon
│   │   └── Footer.tsx               # Footer component
│   ├── services/
│   │   ├── pusher.ts                # Pusher service
│   │   ├── api.ts                   # API service
│   │   └── storage.ts               # AsyncStorage wrapper
│   ├── hooks/
│   │   └── usePusher.ts             # Pusher hook
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── utils/
│   │   └── cn.ts                    # className utility
│   └── assets/
│       └── fonts/                   # Custom fonts (Roca, Garet)
```

### Configuration Files

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        roca: ['Roca'],
        garet: ['Garet'],
      },
    },
  },
  plugins: [],
}
```

**babel.config.js:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

**app.json (add deep linking):**
```json
{
  "expo": {
    "scheme": "groupsingalong",
    "ios": {
      "bundleIdentifier": "org.cybergoose.groupsingalong",
      "supportsTablet": true
    }
  }
}
```

**.env:**
```
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-app.vercel.app
EXPO_PUBLIC_PUSHER_KEY=your_pusher_key
EXPO_PUBLIC_PUSHER_CLUSTER=us3
```

---

## 2. Navigation Architecture

### Screen Mapping

| Web Route | Mobile Screen | Navigation |
|-----------|--------------|------------|
| `/` | LandingScreen | Default (initial route) |
| `/group/[id]` | GroupScreen | Stack navigation with params |

### AppNavigator.tsx

Create stack navigator with deep linking support:

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LandingScreen from '../screens/LandingScreen'
import GroupScreen from '../screens/GroupScreen'

const Stack = createNativeStackNavigator()

const linking = {
  prefixes: ['groupsingalong://', 'https://groupsingalong.com'],
  config: {
    screens: {
      Landing: '',
      Group: 'group/:id',
    },
  },
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### Navigation Patterns

- Replace `useRouter()` → `useNavigation()`
- Replace `router.push()` → `navigation.navigate()`
- Replace `useParams()` → `route.params`

---

## 3. Component Migration Strategy

### Web to React Native Component Mapping

| Web Component | React Native Equivalent |
|--------------|------------------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1>` | `<Text>` |
| `<button>` | `<Pressable>` + custom Button |
| `<input>` | `<TextInput>` + custom Input |
| `<img>` | `<Image>` |
| Radix Dialog | React Native `<Modal>` |
| Radix Tooltip | Custom tooltip with `<Modal>` |
| Headless components | Custom components |

### UI Component Library Strategy

**Build custom components** using NativeWind + class-variance-authority (same pattern as web app uses with shadcn/ui).

**Button.tsx:**
```typescript
import { Pressable, Text } from 'react-native'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-blue-600',
        outline: 'border border-gray-300 bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress: () => void
  children: string | React.ReactNode
  disabled?: boolean
}

export function Button({ variant, size, onPress, children, disabled }: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }))}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-white font-semibold">{children}</Text>
    </Pressable>
  )
}
```

### Icons

Use `@expo/vector-icons` (Expo's icon library):

```typescript
import { Ionicons } from '@expo/vector-icons'

// Replace Heroicons/Lucide with Ionicons
<Ionicons name="mic" size={24} color="black" />
```

---

## 4. Real-Time Communication (Pusher)

### Pusher.js Compatibility

**Good news:** `pusher-js` works in React Native without modification!

### Pusher Service (src/services/pusher.ts)

```typescript
import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null

export const initPusher = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.EXPO_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherInstance
}

export const getPusher = () => pusherInstance

export const disconnectPusher = () => {
  if (pusherInstance) {
    pusherInstance.disconnect()
    pusherInstance = null
  }
}
```

### usePusher Hook

Create custom hook for Pusher integration (similar to web app pattern):

```typescript
import { useEffect, useRef } from 'react'
import { initPusher } from '../services/pusher'
import type { Channel } from 'pusher-js'

export const usePusher = (groupId: string) => {
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    const pusher = initPusher()
    const channel = pusher.subscribe(`group-lyrics-${groupId}`)
    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [groupId])

  return channelRef.current
}
```

### Event Handling Migration

Event handling stays **identical** to web app:

```typescript
// Same as web app - no changes needed
channel.bind('lyric-update', (data) => {
  setLyrics(data.lyrics)
  setCurrentSong(data.title)
  setCurrentArtist(data.artist)
})

channel.bind('new-user-joined', () => {
  // Re-broadcast current lyrics
})

channel.bind('pusher:subscription_count', (data) => {
  setMemberCount(data.subscription_count)
})
```

---

## 5. API Integration

### API Service (src/services/api.ts)

Create centralized API service to call existing Next.js backend:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export const api = {
  // Call Next.js /api/pusher route
  triggerPusherEvent: async (channel: string, event: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/pusher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, event, data }),
    })
    return response.json()
  },

  // Call Next.js /api/proxy route (Deezer search)
  searchSongs: async (query: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/proxy?query=${encodeURIComponent(query)}`
    )
    return response.json()
  },

  // Direct call to lyrics.ovh API
  fetchLyrics: async (artist: string, title: string) => {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    return response.json()
  },
}
```

### No Backend Changes Required

The Next.js API routes (`/api/pusher`, `/api/proxy`) remain unchanged. Mobile app calls them via HTTP just like the web app does.

---

## 6. Platform-Specific Features

### QR Code Generation

```typescript
import QRCode from 'react-native-qrcode-svg'

<QRCode
  value={`groupsingalong://group/${groupId}`}
  size={200}
  backgroundColor="white"
  color="black"
/>
```

### Share Functionality

Use React Native's built-in Share API:

```typescript
import { Share } from 'react-native'

const handleShare = async () => {
  try {
    await Share.share({
      message: `Join my sing-along group: groupsingalong://group/${groupId}`,
      url: `groupsingalong://group/${groupId}`, // iOS only
    })
  } catch (error) {
    console.error(error)
  }
}
```

### Font Loading

Load custom fonts (Roca, Garet) with expo-font:

```typescript
// App.tsx
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [fontsLoaded] = useFonts({
    'Roca': require('./src/assets/fonts/Roca.ttf'),
    'Garet': require('./src/assets/fonts/Garet.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return <AppNavigator />
}
```

### AsyncStorage (localStorage replacement)

```typescript
// src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
  setIsHost: async (value: boolean) => {
    await AsyncStorage.setItem('isHost', value.toString())
  },

  getIsHost: async (): Promise<boolean> => {
    const value = await AsyncStorage.getItem('isHost')
    return value === 'true'
  },

  removeIsHost: async () => {
    await AsyncStorage.removeItem('isHost')
  },
}
```

**Important:** AsyncStorage is async, so update all localStorage calls:

```typescript
// Web (synchronous)
localStorage.setItem('isHost', 'true')
const isHost = localStorage.getItem('isHost') === 'true'

// React Native (async)
await storage.setIsHost(true)
const isHost = await storage.getIsHost()
```

---

## 7. Styling Migration (NativeWind)

### NativeWind Compatibility

~90% of Tailwind classes work in NativeWind. Key differences:

**Works:**
- Layout: `flex`, `flex-row`, `items-center`, `justify-between`
- Spacing: `p-4`, `m-2`, `gap-4`
- Colors: `bg-blue-500`, `text-white`
- Typography: `text-lg`, `font-bold`
- Borders: `rounded-lg`, `border`, `border-gray-300`

**Doesn't Work:**
- Hover states: `hover:bg-blue-700` (use Pressable states instead)
- Responsive breakpoints: `md:`, `lg:` (use Dimensions API)
- Pseudo-elements: `::before`, `::after`
- Some advanced CSS: `backdrop-blur`, complex gradients

### Gradient Handling

Web gradients need `expo-linear-gradient`:

```typescript
// Web
<div className="bg-gradient-to-r from-blue-500 to-purple-600">

// React Native
import { LinearGradient } from 'expo-linear-gradient'

<LinearGradient
  colors={['#3b82f6', '#9333ea']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  className="..."
>
```

### Responsive Design

Replace Tailwind breakpoints with Dimensions API:

```typescript
import { Dimensions } from 'react-native'

const { width } = Dimensions.get('window')
const isSmallScreen = width < 375
const isMediumScreen = width >= 375 && width < 768
```

### Custom Fonts

Use in NativeWind classes:

```typescript
<Text className="font-roca text-2xl">
<Text className="font-garet">
```

---

## 8. Testing Strategy

### Development Testing

**Simulator Testing:**
```bash
npx expo start
# Press 'i' for iOS simulator
```

**Real Device Testing:**
```bash
npx expo start
# Scan QR code with Expo Go app on iPhone
```

### Two-Device Testing for Real-Time

Since this is a real-time app, you'll need to test with multiple devices:

1. **Simulator + Real Device:** One as host, one as singer
2. **Two Real Devices:** iPhone + iPad, or two iPhones
3. **Web + Mobile:** Host on web app, singer on mobile app

### Testing Checklist

- [ ] Create group (host flow)
- [ ] Join group with code (singer flow)
- [ ] Search songs (Deezer API)
- [ ] Select song → lyrics appear for all
- [ ] New member joins → receives current lyrics
- [ ] Member count updates
- [ ] Font size adjustment
- [ ] QR code generation and scanning
- [ ] Share functionality (SMS)
- [ ] Host disconnect → all members notified
- [ ] Deep linking (groupsingalong://group/ABCD)
- [ ] Background/foreground handling
- [ ] Network offline/online transitions
- [ ] Album cover images load correctly

---

## 9. Critical Files to Migrate

### File Mapping

| Web File | Mobile File | Migration Notes |
|----------|-------------|----------------|
| `src/app/page.tsx` | `src/screens/LandingScreen.tsx` | Remove Next.js Image, Link; use RN equivalents |
| `src/app/group/[id]/page.tsx` | `src/screens/GroupScreen.tsx` | **Most complex:** Migrate all Pusher logic, API calls, lyrics display |
| `src/app/layout.tsx` | `App.tsx` | Font loading, remove HTML/body tags |
| `src/components/ui/button.tsx` | `src/components/ui/Button.tsx` | Replace `<button>` with `<Pressable>` |
| `src/components/ui/input.tsx` | `src/components/ui/Input.tsx` | Replace `<input>` with `<TextInput>` |
| `src/components/ui/card.tsx` | `src/components/ui/Card.tsx` | Direct div→View, minimal changes |
| `src/components/ui/dialog.tsx` | `src/components/ui/Modal.tsx` | Replace Radix Dialog with RN Modal |
| `src/components/ThemeIcon.tsx` | `src/components/ThemeIcon.tsx` | Replace SVG with Ionicons |
| `src/components/Footer.tsx` | `src/components/Footer.tsx` | Remove install button (not needed in native) |

### Most Critical: GroupScreen.tsx

This file contains 90% of the app's functionality. Key sections to migrate from `src/app/group/[id]/page.tsx`:

1. **State management** (useState hooks) - stays same
2. **Pusher initialization** - use usePusher hook
3. **Event handlers** - same event binding logic
4. **API calls** - use api service
5. **AsyncStorage** - replace localStorage
6. **UI components** - replace with RN components

Reference web file at: `/Users/ern/sing-along/groupsingalong/src/app/group/[id]/page.tsx`

---

## 10. Implementation Order (10-Phase Plan)

### Phase 1: Foundation (Day 1)
- [ ] Create Expo project
- [ ] Install all dependencies
- [ ] Configure NativeWind, Babel, Tailwind
- [ ] Set up directory structure
- [ ] Create .env file with API URL and Pusher keys
- [ ] Configure app.json with deep linking

### Phase 2: Navigation & Base UI (Day 2)
- [ ] Create AppNavigator with stack navigation
- [ ] Set up deep linking configuration
- [ ] Create base UI components: Button, Input, Card, Modal
- [ ] Create utils (cn.ts for className merging)
- [ ] Load custom fonts (Roca, Garet)

### Phase 3: Landing Screen (Day 3)
- [ ] Create LandingScreen component
- [ ] Implement "Create Group" functionality (generate 4-letter code)
- [ ] Implement "Join Group" functionality (input code)
- [ ] Add AsyncStorage to save isHost flag
- [ ] Navigation to GroupScreen with groupId param
- [ ] Test navigation flow

### Phase 4: API Integration (Day 4)
- [ ] Create api.ts service
- [ ] Implement triggerPusherEvent function
- [ ] Implement searchSongs function (Deezer)
- [ ] Implement fetchLyrics function (lyrics.ovh)
- [ ] Test API calls with real backend
- [ ] Handle errors and loading states

### Phase 5: Pusher Integration (Day 5)
- [ ] Create pusher.ts service
- [ ] Create usePusher hook
- [ ] Test Pusher connection in mobile app
- [ ] Implement channel subscription
- [ ] Implement event binding (lyric-update, new-user-joined, etc.)
- [ ] Test real-time messaging between devices

### Phase 6: GroupScreen UI (Day 6)
- [ ] Create GroupScreen layout
- [ ] Display role (Host/Singer)
- [ ] Display group code
- [ ] Display member count
- [ ] Display lyrics (ScrollView)
- [ ] Display current song info + album cover
- [ ] Add font size controls (+/-)
- [ ] Style with NativeWind

### Phase 7: Host Features (Day 7)
- [ ] Song search input and results list
- [ ] Implement song selection
- [ ] Fetch lyrics from API
- [ ] Broadcast lyrics via Pusher
- [ ] Handle new user joined event (re-broadcast)
- [ ] Implement host disconnect cleanup

### Phase 8: Share & QR Features (Day 8)
- [ ] Implement QR code generation
- [ ] Implement Share functionality (SMS)
- [ ] Create share modal
- [ ] Test deep linking (scan QR → open app → join group)

### Phase 9: Polish & UX (Day 9)
- [ ] Add loading states for all async operations
- [ ] Add error handling and user feedback
- [ ] Implement host disconnect notification for singers
- [ ] Add empty states (no lyrics, no search results)
- [ ] Test font size adjustment
- [ ] Optimize performance (useMemo, useCallback)
- [ ] Add keyboard handling (dismiss on scroll)

### Phase 10: Testing & Deployment (Day 10)
- [ ] Complete testing checklist (all 14 items)
- [ ] Test on real iOS device
- [ ] Test real-time features with 2+ devices
- [ ] Test deep linking from SMS, QR code
- [ ] Test edge cases (network offline, host disconnect)
- [ ] Build for TestFlight
- [ ] Submit to App Store (if ready)

---

## Technical Considerations

### Performance
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed to children
- Use `React.memo` for pure components
- Optimize long lyrics with `ScrollView` + `removeClippedSubviews`

### Error Handling
- Wrap API calls in try/catch
- Show user-friendly error messages (Toast or Alert)
- Handle Pusher connection errors
- Handle network offline scenarios

### Edge Cases
- **Host leaves:** Broadcast host-disconnect event, redirect all to Landing
- **App backgrounded:** Pusher maintains connection (verify this behavior)
- **Network interruption:** Pusher auto-reconnects
- **Invalid group code:** Show error, don't navigate
- **No lyrics found:** Show friendly message

---

## Dependencies Summary

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "19.0.0",
    "react-native": "0.76.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "react-native-safe-area-context": "4.11.0",
    "react-native-screens": "~4.0.0",
    "nativewind": "^4.0.1",
    "pusher-js": "^8.4.0-rc2",
    "react-native-qrcode-svg": "^6.3.11",
    "react-native-svg": "15.8.0",
    "expo-font": "~12.0.10",
    "@expo/vector-icons": "^14.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "expo-linear-gradient": "~13.0.2"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.3.2"
  }
}
```

---

## Next Steps

1. Start with Phase 1 (Foundation) to set up the project
2. Follow the 10-phase implementation order
3. Test thoroughly on real devices
4. Deploy to TestFlight for beta testing

The existing Next.js backend requires no changes - both web and mobile apps will coexist and share the same API infrastructure.
