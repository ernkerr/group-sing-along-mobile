import React, { useMemo } from 'react'
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native'
import { cn } from '@/utils/cn'
import { useTheme } from '@/context/ThemeContext'

interface TextProps extends RNTextProps {
  className?: string
  style?: TextStyle
  scale?: boolean
}

export function RocaText({ className, style, scale, ...props }: TextProps) {
  const { getScaledSize } = useTheme()

  const computedStyle = useMemo(() => {
    if (!scale || !style?.fontSize) {
      return [{ fontFamily: 'Roca' }, style]
    }
    return [
      { fontFamily: 'Roca' },
      style,
      { fontSize: getScaledSize(style.fontSize) },
    ]
  }, [scale, style, getScaledSize])

  return (
    <RNText
      {...props}
      className={cn(className)}
      style={computedStyle}
    />
  )
}

export function GaretText({ className, style, scale, ...props }: TextProps) {
  const { getScaledSize } = useTheme()

  const computedStyle = useMemo(() => {
    if (!scale || !style?.fontSize) {
      return [{ fontFamily: 'Garet' }, style]
    }
    return [
      { fontFamily: 'Garet' },
      style,
      { fontSize: getScaledSize(style.fontSize) },
    ]
  }, [scale, style, getScaledSize])

  return (
    <RNText
      {...props}
      className={cn(className)}
      style={computedStyle}
    />
  )
}

export function InterText({ className, style, scale, ...props }: TextProps) {
  const { getScaledSize } = useTheme()

  const computedStyle = useMemo(() => {
    if (!scale || !style?.fontSize) {
      return [{ fontFamily: 'Inter' }, style]
    }
    return [
      { fontFamily: 'Inter' },
      style,
      { fontSize: getScaledSize(style.fontSize) },
    ]
  }, [scale, style, getScaledSize])

  return (
    <RNText
      {...props}
      className={cn(className)}
      style={computedStyle}
    />
  )
}

export function BricolageText({ className, style, scale, ...props }: TextProps) {
  const { getScaledSize } = useTheme()

  const computedStyle = useMemo(() => {
    if (!scale || !style?.fontSize) {
      return [{ fontFamily: 'Bricolage' }, style]
    }
    return [
      { fontFamily: 'Bricolage' },
      style,
      { fontSize: getScaledSize(style.fontSize) },
    ]
  }, [scale, style, getScaledSize])

  return (
    <RNText
      {...props}
      className={cn(className)}
      style={computedStyle}
    />
  )
}
