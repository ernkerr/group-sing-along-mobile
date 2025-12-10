import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary shadow",
        gradient: "", // Special variant - handled separately
        destructive: "bg-red-500 shadow-sm",
        outline: "border-2 border-violet-300 bg-white shadow-sm",
        secondary: "bg-gray-200 shadow-sm",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-16 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("text-sm font-medium text-center", {
  variants: {
    variant: {
      default: "text-white",
      gradient: "text-white",
      destructive: "text-white",
      outline: "text-violet-400",
      secondary: "text-gray-900",
      ghost: "text-gray-900",
      link: "text-primary underline",
    },
    size: {
      default: "text-md",
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

// Platform-specific shadow styles
const shadowStyles = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
});

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  children?: string | React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void; // Alias for onPress to match web API
}

export function Button({
  variant,
  size,
  onPress,
  onClick,
  children,
  disabled,
  loading,
  className,
}: ButtonProps) {
  const handlePress = onPress || onClick;

  // Content to render
  const content = loading ? (
    <ActivityIndicator
      size="small"
      color={
        variant === "default" ||
        variant === "destructive" ||
        variant === "gradient"
          ? "white"
          : "#374151"
      }
    />
  ) : typeof children === "string" ? (
    <Text className={textVariants({ variant, size })}>{children}</Text>
  ) : (
    <View className="flex-row items-center gap-2">{children}</View>
  );

  // Gradient variant uses LinearGradient wrapper
  if (variant === "gradient") {
    return (
      <LinearGradient
        colors={["#A68BF7", "#C4B4FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            borderRadius: 6,
            opacity: disabled || loading ? 0.5 : 1,
          },
          shadowStyles,
        ]}
      >
        <Pressable
          className={cn(
            buttonVariants({ variant: "gradient", size }),
            className
          )}
          onPress={handlePress}
          disabled={disabled || loading || !handlePress}
          style={({ pressed }) => ({
            opacity: pressed && !disabled && !loading ? 0.9 : 1,
          })}
        >
          {content}
        </Pressable>
      </LinearGradient>
    );
  }

  // All other variants
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        (disabled || loading) && "opacity-50",
        className
      )}
      onPress={handlePress}
      disabled={disabled || loading || !handlePress}
      style={({ pressed }) => ({
        opacity: pressed && !disabled && !loading ? 0.9 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
