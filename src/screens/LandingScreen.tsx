import React, { useState } from "react";
import { View, ScrollView, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mic, Users, X } from "lucide-react-native";
import { BricolageText, InterText } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generateGroupCode } from "@/utils/generateCode";
import { storage } from "@/services/storage";
import type { RootStackParamList } from "@/types";
import { useTheme } from "@/context/ThemeContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Landing">;

export default function LandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGroup = async () => {
    setIsCreating(true);
    try {
      const groupId = generateGroupCode();
      await storage.setIsHost(true);
      await storage.setGroupId(groupId);
      navigation.navigate("Group", { id: groupId });
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || joinCode.length !== 4) {
      return;
    }

    setIsJoining(true);
    try {
      const groupId = joinCode.toUpperCase();
      await storage.setIsHost(false);
      await storage.setGroupId(groupId);
      navigation.navigate("Group", { id: groupId });
    } catch (error) {
      console.error("Error joining group:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          className="flex-row items-center gap-2 px-6 py-4 border-b"
          style={{ borderBottomColor: colors.border }}
        >
          <Mic size={24} color={colors.foreground} />
          <BricolageText
            className="text-xl font-semibold"
            style={{ color: colors.foreground }}
          >
            Group Sing Along
          </BricolageText>
        </View>

        <View className="px-6 py-8">
          {/* Hero Section */}
          <View className="items-center mb-8">
            <BricolageText
              className="text-center mb-4"
              style={{
                fontSize: 36,
                fontWeight: "bold",
                lineHeight: 44,
                color: colors.foreground,
              }}
            >
              Make Group Singing Easy and Fun
            </BricolageText>
            <InterText
              className="text-center mb-8"
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: colors.mutedForeground,
              }}
            >
              The perfect solution for family gatherings, parties, and any group
              sing-along event. Everyone sees the lyrics in real-time,
              controlled by a single host.
            </InterText>

            {/* Action Buttons */}
            <View className="w-full gap-6 mb-8">
              <Button
                onPress={handleCreateGroup}
                loading={isCreating}
                disabled={isCreating || isJoining}
                variant="gradient"
                size="lg"
              >
                <InterText className="text-white font-semibold text-xl">
                  Create Group
                </InterText>
              </Button>

              <Button
                onPress={() => setShowJoinInput(true)}
                variant="outline"
                size="lg"
                disabled={isCreating}
              >
                <InterText
                  className="font-semibold text-xl"
                  style={{ color: "#C4B4FD" }}
                >
                  Join Group
                </InterText>
              </Button>
            </View>
          </View>

          {/* Join Group Modal */}
          <Modal
            visible={showJoinInput}
            transparent
            animationType="fade"
            onRequestClose={() => setShowJoinInput(false)}
          >
            <Pressable
              className="flex-1 bg-black/50 justify-center items-center px-6"
              onPress={() => setShowJoinInput(false)}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  className="rounded-2xl p-8 w-full max-w-md"
                  style={{ minWidth: 320, backgroundColor: colors.card }}
                >
                  {/* Modal Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <BricolageText
                      className="text-2xl font-bold"
                      style={{ color: colors.foreground }}
                    >
                      Join Group
                    </BricolageText>
                    <Pressable
                      onPress={() => setShowJoinInput(false)}
                      className="p-2 -mr-2"
                    >
                      <X size={24} color={colors.muted} />
                    </Pressable>
                  </View>

                  {/* Modal Content */}
                  <InterText
                    className="text-base mb-6"
                    style={{ color: colors.mutedForeground }}
                  >
                    Enter the 4-letter code shared by your group host to join
                    the sing-along session.
                  </InterText>

                  <View className="mb-6">
                    <InterText
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.foreground }}
                    >
                      Group Code
                    </InterText>
                    <Input
                      placeholder="ABCD"
                      value={joinCode}
                      onChangeText={setJoinCode}
                      autoCapitalize="characters"
                      maxLength={4}
                      className="text-center text-2xl font-bold"
                    />
                  </View>

                  <View className="gap-3">
                    <Button
                      onPress={handleJoinGroup}
                      loading={isJoining}
                      disabled={joinCode.length !== 4}
                      variant="gradient"
                      size="lg"
                    >
                      <InterText className="text-white font-semibold text-lg">
                        Join Now
                      </InterText>
                    </Button>

                    <Button
                      onPress={() => {
                        setShowJoinInput(false);
                        setJoinCode("");
                      }}
                      variant="ghost"
                      size="lg"
                    >
                      <InterText
                        className="font-semibold text-base"
                        style={{ color: colors.mutedForeground }}
                      >
                        Cancel
                      </InterText>
                    </Button>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Example Preview Card with Backlit Shadow */}
          <View className="mb-8">
            <View
              style={{
                shadowColor: "#A68BF7",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View
                className="border overflow-hidden rounded-lg"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <View
                  className="px-4 py-3 flex-row items-center justify-between border-b"
                  style={{
                    backgroundColor: colors.muted,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Mic size={18} color={colors.mutedForeground} />
                    <InterText
                      className="text-sm font-semibold"
                      style={{ color: colors.foreground }}
                    >
                      Family Sing-Along
                    </InterText>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Users size={16} color={colors.mutedForeground} />
                    <InterText
                      className="text-sm"
                      style={{ color: colors.mutedForeground }}
                    >
                      12 members
                    </InterText>
                  </View>
                </View>
                <View className="px-4 py-6">
                  <BricolageText
                    className="text-2xl font-bold text-center mb-2"
                    style={{ color: colors.foreground }}
                  >
                    Bohemian Rhapsody
                  </BricolageText>
                  <InterText
                    className="text-base text-center mb-6"
                    style={{ color: colors.mutedForeground }}
                  >
                    Queen
                  </InterText>
                  <View className="gap-3">
                    <InterText
                      className="text-lg text-center"
                      style={{ color: colors.foreground }}
                    >
                      Is this the real life?
                    </InterText>
                    <InterText
                      className="text-lg font-bold text-center"
                      style={{ color: colors.foreground }}
                    >
                      Is this just fantasy?
                    </InterText>
                    <InterText
                      className="text-lg text-center"
                      style={{ color: colors.foreground }}
                    >
                      Caught in a landslide,
                    </InterText>
                    <InterText
                      className="text-lg text-center"
                      style={{ color: colors.foreground }}
                    >
                      no escape from reality
                    </InterText>
                    <InterText
                      className="text-lg text-center"
                      style={{ color: colors.foreground }}
                    >
                      I'm just a poor boy,
                    </InterText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* How it Works */}
          <View className="mb-12">
            <BricolageText
              className="text-3xl font-bold mb-3 text-center"
              style={{ color: colors.foreground }}
            >
              How It Works
            </BricolageText>
            <InterText
              className="text-base text-center mb-8"
              style={{ color: colors.mutedForeground }}
            >
              Get started in just three simple steps
            </InterText>

            <View className="gap-6">
              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <InterText
                    className="font-bold text-2xl"
                    style={{ color: colors.primaryForeground }}
                  >
                    1
                  </InterText>
                </View>
                <BricolageText
                  className="text-xl font-bold mb-2 text-center"
                  style={{ color: colors.foreground }}
                >
                  Create a Group
                </BricolageText>
                <InterText
                  className="text-base text-center"
                  style={{ color: colors.mutedForeground }}
                >
                  Start a new sing-along session as the host and get a unique
                  group code.
                </InterText>
              </View>

              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <InterText
                    className="font-bold text-2xl"
                    style={{ color: colors.primaryForeground }}
                  >
                    2
                  </InterText>
                </View>
                <BricolageText
                  className="text-xl font-bold mb-2 text-center"
                  style={{ color: colors.foreground }}
                >
                  Share the Code
                </BricolageText>
                <InterText
                  className="text-base text-center"
                  style={{ color: colors.mutedForeground }}
                >
                  Invite others to join your group by sharing the unique code.
                </InterText>
              </View>

              <View className="items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary }}
                >
                  <InterText
                    className="font-bold text-2xl"
                    style={{ color: colors.primaryForeground }}
                  >
                    3
                  </InterText>
                </View>
                <BricolageText
                  className="text-xl font-bold mb-2 text-center"
                  style={{ color: colors.foreground }}
                >
                  Start Singing
                </BricolageText>
                <InterText
                  className="text-base text-center"
                  style={{ color: colors.mutedForeground }}
                >
                  Select songs and control the lyrics display for everyone in
                  the group.
                </InterText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
