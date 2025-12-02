import React from 'react'
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native'
import { cn } from '@/utils/cn'

interface TextProps extends RNTextProps {
  className?: string
  style?: TextStyle
}

export function RocaText({ className, style, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      className={cn(className)}
      style={[{ fontFamily: 'Roca' }, style]}
    />
  )
}

export function GaretText({ className, style, ...props }: TextProps) {
  return (
    <RNText
      {...props}
      className={cn(className)}
      style={[{ fontFamily: 'Garet' }, style]}
    />
  )
}
