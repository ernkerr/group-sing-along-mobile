import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-blue-600',
        outline: 'border-2 border-blue-600 bg-transparent',
        ghost: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2',
        lg: 'h-14 px-8 py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const textVariants = cva(
  'font-semibold text-center',
  {
    variants: {
      variant: {
        default: 'text-white',
        outline: 'text-blue-600',
        ghost: 'text-blue-600',
      },
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'text-lg',
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
  loading?: boolean
  className?: string
}

export function Button({
  variant,
  size,
  onPress,
  children,
  disabled,
  loading,
  className
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        disabled && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'default' ? 'white' : '#2563eb'} />
      ) : typeof children === 'string' ? (
        <Text className={textVariants({ variant, size })}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
