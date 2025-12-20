import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersonProfileIcon } from "./icons";
import { LinkedInIcon } from "./SocialIcons";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export interface SpeakerDetailModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  affiliation: string;
  bio?: string;
  interests?: string[];
  tags?: string[];
  socialLabel?: string;
}

export default function SpeakerDetailModal({
  visible,
  onClose,
  name,
  affiliation,
  bio,
  interests = [],
  tags = [],
  socialLabel,
}: SpeakerDetailModalProps) {
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
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.sheetContainer}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Header: Avatar + Name/Affiliation */}
              <View style={styles.headerRow}>
                <View style={styles.avatarWrapper}>
                  <PersonProfileIcon size={28} color="#111827" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.nameText}>{name}</Text>
                  <Text style={styles.affiliationText}>{affiliation}</Text>
                </View>
              </View>

              {/* Tags */}
              {tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tagPill}>
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
                    {interests.map((interest, index) => (
                      <View key={index} style={styles.interestPill}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Social Links */}
              {socialLabel && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Social Links</Text>
                  <Pressable style={styles.socialButton}>
                    <LinkedInIcon size={18} color="#0A66C2" />
                    <Text style={styles.socialButtonText}>{socialLabel}</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
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
    zIndex: 10000,
    elevation: 10000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    justifyContent: "flex-end",
  },
  sheetContainer: {
    alignSelf: "center",
    width: SHEET_MAX_WIDTH,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
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
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  affiliationText: {
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
    borderRadius: 999,
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
    borderRadius: 999,
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
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
});
