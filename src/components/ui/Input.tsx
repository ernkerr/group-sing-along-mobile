import React from "react";
import { TextInput, View, Text, Platform, TextStyle } from "react-native";
import { cn } from "@/utils/cn";
import { useTheme } from "@/context/ThemeContext";
import { HEIGHTS } from "@/constants";

type InputHeight = "sm" | "default" | "lg";

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: { target: { value: string } }) => void; // Web-style onChange
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  editable?: boolean;
  maxLength?: number;
  className?: string;
  label?: string;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
  onKeyDown?: (e: any) => void;
  type?: string; // For web compatibility
  textAlign?: "left" | "center" | "right";
  textAlignVertical?: "auto" | "top" | "bottom" | "center";
  style?: TextStyle;
  height?: InputHeight;
}

const heightValues: Record<InputHeight, number> = {
  sm: HEIGHTS.inputSm,
  default: HEIGHTS.input,
  lg: HEIGHTS.inputLg,
};

// Enhanced shadow styles for lg shadow effect
const shadowStyles = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  android: {
    elevation: 4,
  },
});

export function Input({
  placeholder,
  value,
  onChangeText,
  onChange,
  autoCapitalize = "none",
  autoCorrect = false,
  keyboardType = "default",
  secureTextEntry = false,
  editable = true,
  maxLength,
  className,
  label,
  returnKeyType,
  onSubmitEditing,
  onKeyDown,
  type,
  textAlign = "left",
  textAlignVertical = "center",
  style,
  height = "default",
}: InputProps) {
  const { colors, colorScheme } = useTheme();

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    if (onChange) {
      onChange({ target: { value: text } });
    }
  };

  // Handle secureTextEntry from type prop
  const isSecure = secureTextEntry || type === "password";

  return (
    <View className="w-full">
      {label && (
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.foreground }}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 6,
            height: style?.height ?? heightValues[height],
            justifyContent: "center",
          },
          shadowStyles,
        ]}
      >
        <TextInput
          className={cn(
            "w-full text-base",
            "placeholder:text-gray-400",
            !editable && "opacity-50",
            className
          )}
          style={[
            {
              color: colors.foreground,
              fontFamily: "Garet",
              paddingHorizontal: 12,
              paddingVertical: 0,
              margin: 0,
              textAlign,
              textAlignVertical,
              fontSize: style?.fontSize,
              fontWeight: style?.fontWeight,
              letterSpacing: style?.letterSpacing,
              lineHeight: style?.fontSize ? style.fontSize * 1.2 : undefined,
              includeFontPadding: false,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colorScheme === "dark" ? "#9ca3af" : "#6b7280"}
          value={value}
          onChangeText={handleChangeText}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          secureTextEntry={isSecure}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </View>
    </View>
  );
}
