import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersonProfileIcon } from "./icons";
import { LinkedInIcon } from "./SocialIcons";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export interface ParticipantDetailModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  role: string;
  company: string;
  tags?: string[]; // e.g. ["Fintech", "Nigeria"]
  bio?: string;
  interests?: string[];
  socialLabel?: string; // e.g. "Flutterwave.ng"
  linkedInUrl?: string; // Full LinkedIn URL for opening profiles
}

export default function ParticipantDetailModal({
  visible,
  onClose,
  name,
  role,
  company,
  tags = [],
  bio,
  interests = [],
  socialLabel,
  linkedInUrl,
}: ParticipantDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.backdropContainer}>
        {/* Dimmed background */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet Card */}
        <View style={styles.sheetWrapper}>
          <View style={styles.sheetContainer}>
            <GuidelinePatternOverlay isLightCard opacity={0.05} />
            <View style={{ position: "relative", zIndex: 10, flex: 1 }}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
              {/* Header: Avatar + Name/Role */}
              <View style={styles.headerRow}>
                <View style={styles.avatarWrapper}>
                  <PersonProfileIcon size={28} color="#111827" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.nameText}>{name}</Text>
                  <Text style={styles.roleText}>
                    {role}
                    {company ? `· ${company}` : ""}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Bio / Description */}
              {bio && <Text style={styles.bioText}>{bio}</Text>}

              {/* Interests */}
              {interests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.interestsRow}>
                    {interests.map((interest) => (
                      <View key={interest} style={styles.interestPill}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Social Links - display label (username), open full URL */}
              {(() => {
                const info = getLinkedInDisplayInfo(linkedInUrl ?? socialLabel);
                if (!info) return null;
                return (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Social Links</Text>
                    <Pressable
                      style={styles.socialButton}
                      onPress={async () => {
                        try {
                          const supported = await Linking.canOpenURL(info.url);
                          if (supported) {
                            await Linking.openURL(info.url);
                          } else {
                            try {
                              await Linking.openURL(info.url);
                            } catch (openError) {
                              Alert.alert(
                                "Cannot Open LinkedIn",
                                "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
                                [{ text: "OK" }]
                              );
                            }
                          }
                        } catch (error) {
                          Alert.alert("Error", "Failed to open LinkedIn profile");
                        }
                      }}
                    >
                      <LinkedInIcon size={18} color="#0A66C2" />
                      <Text
                        style={styles.socialButtonText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {info.displayLabel}
                      </Text>
                    </Pressable>
                  </View>
                );
              })()}
            </ScrollView>
            </View>
          </View>
          <SafeAreaView edges={["bottom"]} style={styles.bottomSafeArea} />
        </View>
      </View>
    </Modal>
  );
}

const SHEET_MAX_WIDTH = Math.min(SCREEN_WIDTH, 420);

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    alignSelf: "center",
    width: SHEET_MAX_WIDTH,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: "hidden",
    minHeight: SCREEN_HEIGHT * 0.5,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  bottomSafeArea: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: "#6B7280",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  tagText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  bioText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: "#F3F4F6",
  },
  interestText: {
    fontSize: 12,
    color: "#111827",
  },
  socialButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    maxWidth: 200,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
    flexShrink: 1,
  },
});
