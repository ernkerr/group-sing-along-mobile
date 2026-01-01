import React from "react";
import { View, Pressable } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GaretText } from "@/components/ui/Typography";
import { useTheme } from "@/context/ThemeContext";
import { GRADIENTS, GRAY } from "@/constants";

interface SongListItemProps {
  title: string;
  artist: string;
  display?: string;
  onPress: () => void;
  actionLabel: "Request" | "Select";
  showDivider?: boolean;
  scale?: boolean;
}

export function SongListItem({
  title,
  artist,
  display,
  onPress,
  actionLabel,
  showDivider = true,
  scale = false,
}: SongListItemProps) {
  const { colors, getScaledSize } = useTheme();

  // Base sizes - made bigger for better visibility
  const baseFontSize = 16;
  const baseButtonSize = 14;
  const fontSize = scale ? getScaledSize(baseFontSize) : baseFontSize;
  const buttonSize = scale ? getScaledSize(baseButtonSize) : baseButtonSize;
  const padding = scale ? getScaledSize(16) : 16;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: GRAY[200],
      }}
    >
      <GaretText
        className="flex-1 mr-3"
        style={{ fontSize, color: colors.foreground }}
      >
        {display || `${title} - ${artist}`}
      </GaretText>
      <LinearGradient
        colors={GRADIENTS.primary as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 8, minWidth: 80, minHeight: 48, justifyContent: "center", alignItems: "center" }}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 14,
            opacity: pressed ? 0.8 : 1,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          })}
        >
          <GaretText
            className="text-white font-semibold"
            style={{ fontSize: 16 }}
          >
            {actionLabel}
          </GaretText>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
