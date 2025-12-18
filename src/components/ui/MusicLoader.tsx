import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import Svg, { Ellipse, Path } from 'react-native-svg'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { useTheme } from '@/context/ThemeContext'

const loaderVariants = cva(
  'flex-row items-center justify-center',
  {
    variants: {
      size: {
        small: 'gap-0.5',
        medium: 'gap-1',
        large: 'gap-2',
      },
    },
    defaultVariants: {
      size: 'medium',
    },
  }
)

const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
}

interface MusicLoaderProps extends VariantProps<typeof loaderVariants> {
  color?: string
  className?: string
}

// Custom music note SVG component matching your original design
const MusicNote = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Ellipse
      cx="50"
      cy="75.651"
      rx="19.347"
      ry="16.432"
      fill={color}
      transform="rotate(-21.283 50 75.651)"
    />
    <Path fill={color} d="M58.474 7.5h10.258v63.568H58.474z" />
  </Svg>
)

export function MusicLoader({ size = 'medium', color, className }: MusicLoaderProps) {
  const { colors } = useTheme()
  const iconColor = color || colors.primary

  // Create 3 animated values (one per icon)
  const anim1 = useRef(new Animated.Value(0)).current
  const anim2 = useRef(new Animated.Value(0)).current
  const anim3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animation matching your CSS keyframes:
    // 0-20%: Raise, 20-40%: Lower, 40-60%: Center, 60-100%: Stay centered
    const createBounce = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          // 0-20%: Raise (move up)
          Animated.timing(animValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // 20-40%: Lower (move down)
          Animated.timing(animValue, {
            toValue: -1,
            duration: 200,
            useNativeDriver: true,
          }),
          // 40-60%: Return to center
          Animated.timing(animValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          // 60-100%: Stay centered
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const parallel = Animated.parallel([
      createBounce(anim1, 0),
      createBounce(anim2, 200),
      createBounce(anim3, 400),
    ])

    parallel.start()

    return () => parallel.stop()
  }, [anim1, anim2, anim3])

  const iconSize = iconSizes[size || 'medium']
  const ratio = 2 / 3 // Your original CSS ratio

  // Interpolate to match CSS: translateY(calc(-50% * (1 - var(--ratio))))
  // For ratio 2/3: up = -50% * (1 - 2/3) = -50% * 1/3 = -16.67%
  const translateY1 = anim1.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [iconSize * 0.5 * (1 - ratio), 0, -iconSize * 0.5 * (1 - ratio)],
  })

  const translateY2 = anim2.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [iconSize * 0.5 * (1 - ratio), 0, -iconSize * 0.5 * (1 - ratio)],
  })

  const translateY3 = anim3.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [iconSize * 0.5 * (1 - ratio), 0, -iconSize * 0.5 * (1 - ratio)],
  })

  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      className={cn(loaderVariants({ size }), className)}
    >
      <Animated.View style={{ transform: [{ translateY: translateY1 }] }}>
        <MusicNote size={iconSize} color={iconColor} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: translateY2 }] }}>
        <MusicNote size={iconSize} color={iconColor} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: translateY3 }] }}>
        <MusicNote size={iconSize} color={iconColor} />
      </Animated.View>
    </View>
  )
}
