import React from 'react'
import { View } from 'react-native'
import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('bg-white rounded-lg p-4 shadow-md', className)}>
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
    <View className={cn('mb-2', className)}>
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
