import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { GaretText } from "@/components/ui/Typography";
import { api } from "@/services/api";

interface SessionTimerProps {
  sessionExpiresAt: string;
  groupId: string;
  onSessionExpired: () => void;
}

/**
 * Displays countdown timer for EVENT tier sessions
 * Handles its own state to avoid re-rendering parent component every second
 */
export function SessionTimer({
  sessionExpiresAt,
  groupId,
  onSessionExpired,
}: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const expiry = new Date(sessionExpiresAt);
      const remaining = Math.floor((expiry.getTime() - now.getTime()) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        // Broadcast session-expired event to all members
        try {
          await api.triggerPusherEvent(
            `group-lyrics-${groupId}`,
            "session-expired",
            { message: "24-hour session has ended" }
          );
        } catch (error) {
          console.error("Error broadcasting session expiry:", error);
        }
        onSessionExpired();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, groupId, onSessionExpired]);

  // Format time remaining (seconds) to HH:MM:SS
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (timeRemaining === null) {
    return null;
  }

  return (
    <View
      className="mx-6 mt-4 px-4 py-3 rounded-lg border"
      style={{
        backgroundColor: "#fef3c7",
        borderColor: "#f59e0b",
      }}
    >
      <GaretText className="text-sm font-semibold text-center text-amber-800">
        ⏱️ Session expires in: {formatTimeRemaining(timeRemaining)}
      </GaretText>
    </View>
  );
}
