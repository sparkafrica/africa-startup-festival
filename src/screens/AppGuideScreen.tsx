import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { APP_GUIDE_CONTENT } from "../constants/appGuideContent";

type Props = RootStackScreenProps<"AppGuide">;

/** Faded "ATE" watermark running diagonally across the background */
function FadedLogoPattern() {
  const { width, height } = useWindowDimensions();
  const cell = 64;
  const size = Math.max(width, height) * 1.8;
  const cols = Math.ceil(size / cell);
  const rows = Math.ceil(size / cell);
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
            <Text key={i} style={styles.patternCell}>
              ATE
            </Text>
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
      <FadedLogoPattern />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.navigate("Menu")}
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
          <Text style={styles.body}>{APP_GUIDE_CONTENT}</Text>
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
  patternCell: {
    width: 64,
    height: 64,
    fontSize: 13,
    color: "#000000",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 64,
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
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
  },
});
