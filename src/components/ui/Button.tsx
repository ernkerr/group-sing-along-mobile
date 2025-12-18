import React from "react";
import {
  Pressable,
  Text,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { useTheme } from "@/context/ThemeContext";
import { MusicLoader } from "./MusicLoader";

const buttonVariants = cva(
  "flex-row items-center justify-center gap-2 rounded-md transition-all",
  {
    variants: {
      variant: {
        default: "shadow",
        gradient: "", // Special variant - handled separately
        destructive: "shadow-sm",
        outline: "",
        secondary: "shadow-sm",
        ghost: "",
        link: "",
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
      default: "",
      gradient: "text-white",
      destructive: "text-white",
      outline: "text-violet-400",
      secondary: "",
      ghost: "",
      link: "underline",
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

// Platform-specific shadow styles - now created dynamically in component

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
  const { colors, colorScheme } = useTheme();

  // Theme-aware shadow styles
  const shadowStyles = Platform.select({
    ios: {
      shadowColor: colorScheme === "dark" ? "#fff" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === "dark" ? 0.1 : 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
  });

  // Get variant-specific colors
  const getVariantStyles = () => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
        };
      case "destructive":
        return { backgroundColor: colors.destructive, color: "#ffffff" };
      case "outline":
        return {
          backgroundColor: "transparent" as const,
          borderColor: "#C4B4FD",
          borderWidth: 1,
          borderStyle: "solid" as const,
          color: "#C4B4FD",
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary,
          color: colors.secondaryForeground,
        };
      case "ghost":
        return { backgroundColor: "transparent", color: colors.foreground };
      case "link":
        return { backgroundColor: "transparent", color: colors.primary };
      default:
        return {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Get ActivityIndicator color based on variant
  const getIndicatorColor = () => {
    if (variant === "gradient" || variant === "destructive") return "white";
    if (variant === "default") return colors.primaryForeground;
    if (variant === "outline") return "#a78bfa";
    return variantStyles.color;
  };

  // Content to render
  const content = loading ? (
    <MusicLoader size="small" color={getIndicatorColor()} />
  ) : typeof children === "string" ? (
    <Text
      className={textVariants({ variant, size })}
      style={{ color: variantStyles.color }}
    >
      {children}
    </Text>
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
  // For outline variant, wrap in View to ensure border displays correctly
  if (variant === "outline") {
    return (
      <View
        style={{
          borderColor: "#C4B4FD",
          borderWidth: 2,
          borderRadius: 6,
          opacity: disabled || loading ? 0.5 : 1,
        }}
      >
        <Pressable
          className={cn(buttonVariants({ variant, size }), className)}
          onPress={handlePress}
          disabled={disabled || loading || !handlePress}
          style={({ pressed }) => ({
            backgroundColor: "transparent",
            borderRadius: 6,
            opacity: pressed && !disabled && !loading ? 0.9 : 1,
          })}
        >
          {content}
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        (disabled || loading) && "opacity-50",
        className
      )}
      onPress={handlePress}
      disabled={disabled || loading || !handlePress}
      style={({ pressed }) => [
        {
          backgroundColor: variantStyles.backgroundColor,
          borderRadius: 6,
          opacity: pressed && !disabled && !loading ? 0.9 : 1,
        },
        shadowStyles,
      ]}
    >
      {content}
    </Pressable>
  );
}
