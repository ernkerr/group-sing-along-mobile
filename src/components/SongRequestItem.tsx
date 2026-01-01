import React from 'react'
import { View, Image, Pressable } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { GaretText } from '@/components/ui/Typography'
import { useTheme } from '@/context/ThemeContext'
import { GRADIENTS, GRAY, BRAND } from '@/constants'

interface SongRequestItemProps {
  title: string
  artist: string
  albumCover: string
  requestCount?: number
  onAccept: () => void
  showDivider?: boolean
  scale?: boolean
}

export function SongRequestItem({
  title,
  artist,
  albumCover,
  requestCount = 1,
  onAccept,
  showDivider = true,
  scale = false,
}: SongRequestItemProps) {
  const { getScaledSize } = useTheme()

  // Base sizes - made bigger for better visibility
  const baseImageSize = 64
  const baseTitleSize = 16
  const baseArtistSize = 14
  const baseButtonSize = 14

  const imageSize = scale ? getScaledSize(baseImageSize) : baseImageSize
  const titleSize = scale ? getScaledSize(baseTitleSize) : baseTitleSize
  const artistSize = scale ? getScaledSize(baseArtistSize) : baseArtistSize
  const buttonSize = scale ? getScaledSize(baseButtonSize) : baseButtonSize
  const padding = scale ? getScaledSize(16) : 16
  const gap = scale ? getScaledSize(16) : 16

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding,
        gap,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: GRAY[200],
      }}
    >
      {albumCover && (
        <Image
          source={{ uri: albumCover }}
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: 8,
          }}
        />
      )}
      <View className="flex-1">
        <GaretText
          className="font-semibold"
          style={{ fontSize: titleSize }}
        >
          {title}
        </GaretText>
        <GaretText
          style={{
            fontSize: artistSize,
            color: GRAY[500],
            marginTop: 2,
          }}
        >
          {artist}
        </GaretText>
        {requestCount > 1 && (
          <GaretText
            className="font-semibold"
            style={{
              fontSize: artistSize,
              color: BRAND.primary,
              marginTop: 4,
            }}
          >
            Requested {requestCount}x
          </GaretText>
        )}
      </View>
      <LinearGradient
        colors={GRADIENTS.primary as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 8 }}
      >
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => ({
            paddingHorizontal: scale ? getScaledSize(16) : 16,
            paddingVertical: scale ? getScaledSize(10) : 10,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <GaretText
            className="text-white font-semibold"
            style={{ fontSize: buttonSize }}
          >
            Accept
          </GaretText>
        </Pressable>
      </LinearGradient>
    </View>
  )
}
