import React from 'react'
import { View, Platform } from 'react-native'
import { cn } from '@/utils/cn'
import { useTheme } from '@/context/ThemeContext'

interface CardProps {
  children: React.ReactNode
  className?: string
}

// Enhanced shadow styles for xl shadow effect
const shadowStyles = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
})

export function Card({ children, className }: CardProps) {
  const { colors } = useTheme()

  return (
    <View
      className={cn('rounded-lg p-6', className)}
      style={[
        {
          backgroundColor: colors.card,
        },
        shadowStyles,
      ]}
    >
      {children}
    </View>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={cn('mb-4', className)}>
      {children}
    </View>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <View className={className}>
      {children}
    </View>
  )
}
