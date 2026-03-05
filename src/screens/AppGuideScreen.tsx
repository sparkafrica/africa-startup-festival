import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { APP_GUIDE_CONTENT } from "../constants/appGuideContent";

const WATERMARK_IMG = require("../assets/images/Africa Tech Expo watermark.png");

type Props = RootStackScreenProps<"AppGuide">;

type LineType = "mainTitle" | "subTitle" | "sectionHeading" | "label" | "bullet" | "divider" | "body" | "empty";

function getLineType(line: string, index: number): LineType {
  const t = line.trim();
  if (!t) return "empty";
  if (t === "________________" || (t.startsWith("_") && t.length > 8)) return "divider";
  if (index === 0) return "mainTitle";
  if (t === "Frequently Asked Questions (FAQ)") return "subTitle";
  if (/^\d+\.\s+.+\?$/.test(t)) return "sectionHeading";
  if (t === "Required:" || t === "Optional:") return "label";
  if (t.startsWith("* ")) return "bullet";
  return "body";
}

function GuideContent() {
  const lines = APP_GUIDE_CONTENT.split("\n");
  return (
    <View style={styles.contentBlock}>
      {lines.map((line, i) => {
        const type = getLineType(line, i);
        if (type === "empty") return <View key={i} style={styles.spacer} />;
        if (type === "divider") return <View key={i} style={styles.divider} />;
        if (type === "mainTitle")
          return (
            <Text key={i} style={styles.mainTitle}>
              {line.trim()}
            </Text>
          );
        if (type === "subTitle")
          return (
            <Text key={i} style={styles.subTitle}>
              {line.trim()}
            </Text>
          );
        if (type === "sectionHeading")
          return (
            <Text key={i} style={styles.sectionHeading}>
              {line.trim()}
            </Text>
          );
        if (type === "label")
          return (
            <Text key={i} style={styles.label}>
              {line.trim()}
            </Text>
          );
        if (type === "bullet")
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>•</Text>
              <Text style={styles.bulletText}>{line.trim().replace(/^\*\s*/, "")}</Text>
            </View>
          );
        return (
          <Text key={i} style={styles.body}>
            {line}
          </Text>
        );
      })}
    </View>
  );
}

/** Faded ATE logo watermark running diagonally across the background */
function FadedWatermarkPattern() {
  const { width, height } = useWindowDimensions();
  const cell = 100;
  const size = Math.max(width, height) * 1.8;
  const cols = Math.ceil(size / cell) + 2;
  const rows = Math.ceil(size / cell) + 2;
  const items = Array.from({ length: cols * rows }, (_, i) => i);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.diagonalWrap,
          {
            width: size,
            height: size,
            left: -size * 0.4,
            top: -size * 0.2,
          },
        ]}
      >
        <View style={[styles.patternGrid, { width: cols * cell }]}>
          {items.map((i) => (
            <Image
              key={i}
              source={WATERMARK_IMG}
              style={styles.watermarkCell}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AppGuideScreen() {
  const navigation = useNavigation<Props["navigation"]>();

  return (
    <View style={styles.container}>
      <FadedWatermarkPattern />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <ChevronLeftIcon size={28} color="#404040" />
          </Pressable>
          <Text style={styles.title}>App Guide</Text>
          <View style={styles.backPlaceholder} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <GuideContent />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safe: {
    flex: 1,
  },
  diagonalWrap: {
    position: "absolute",
    transform: [{ rotate: "-25deg" }],
    opacity: 0.06,
  },
  patternGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  watermarkCell: {
    width: 100,
    height: 100,
  },
  contentBlock: {
    gap: 0,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletMark: {
    fontSize: 15,
    color: "#374151",
    marginRight: 8,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  spacer: {
    height: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  backPlaceholder: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
});
