import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Image,
  TextInput,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { APP_GUIDE_CONTENT } from "../constants/appGuideContent";
import { searchGuide, getTopicPrimarySection } from "../constants/appGuideIndex";

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

function getSectionNumber(line: string): number | null {
  const m = line.trim().match(/^(\d+)\.\s+/);
  return m ? parseInt(m[1], 10) : null;
}

/** Popular keywords for quick access */
const POPULAR_KEYWORDS = [
  "tickets",
  "login",
  "profile",
  "assign ticket",
  "transfer ticket",
  "meetings",
  "scan",
  "connections",
  "attendees",
];

function GuideContent({
  onSectionLayout,
}: {
  onSectionLayout: (section: number, y: number) => void;
}) {
  const lines = APP_GUIDE_CONTENT.split("\n");

  return (
    <View style={styles.contentBlock}>
      {lines.map((line, i) => {
        const type = getLineType(line, i);
        const sectionNum = type === "sectionHeading" ? getSectionNumber(line) : null;

        if (type === "sectionHeading" && sectionNum) {
          return (
            <View
              key={i}
              onLayout={(e: LayoutChangeEvent) =>
                onSectionLayout(sectionNum, e.nativeEvent.layout.y)
              }
              collapsable={false}
            >
              <Text style={styles.sectionHeading}>{line.trim()}</Text>
            </View>
          );
        }

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
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Record<number, number>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ section: number; title: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSectionLayout = useCallback((section: number, y: number) => {
    sectionOffsetsRef.current[section] = y;
  }, []);

  const scrollToSection = useCallback((section: number) => {
    const offset = sectionOffsetsRef.current[section];
    if (offset != null && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, 20 + offset - 16),
        animated: true,
      });
    }
  }, []);

  const runSearch = useCallback((q: string) => {
    setSearchResults(q ? searchGuide(q) : []);
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        runSearch(text.trim());
        debounceRef.current = null;
      }, 300);
    },
    [runSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const handleKeywordPress = useCallback(
    (kw: string) => {
      const section = getTopicPrimarySection(kw);
      if (section != null) scrollToSection(section);
    },
    [scrollToSection]
  );

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

        <View style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search the guide..."
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={handleClearSearch}
                style={styles.clearButton}
                hitSlop={8}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
          {searchQuery.trim() && searchResults.length > 0 && (
            <ScrollView
              style={styles.searchResultsScroll}
              contentContainerStyle={styles.searchResultsScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              {searchResults.map((r) => (
                <Pressable
                  key={r.section}
                  style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
                  onPress={() => {
                    scrollToSection(r.section);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <Text style={styles.resultTitle}>{r.title}</Text>
                  <Text style={styles.resultSection}>§ {r.section}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try another keyword or visit our support center.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.contactSupportButton,
                  pressed && styles.contactSupportButtonPressed,
                ]}
                onPress={() => navigation.navigate("Contact")}
              >
                <Text style={styles.contactSupportButtonText}>
                  Contact Support Center
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.browseLabel}>Browse by topic</Text>
          <View style={styles.chipRow}>
            {POPULAR_KEYWORDS.map((kw) => (
              <Pressable
                key={kw}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => handleKeywordPress(kw)}
              >
                <Text style={styles.chipText}>{kw}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <GuideContent onSectionLayout={handleSectionLayout} />
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
    opacity: 0.09,
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
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 36,
    fontSize: 15,
    color: "#111827",
  },
  clearButton: {
    position: "absolute",
    right: 8,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  searchResultsScroll: {
    marginTop: 8,
    maxHeight: 280,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchResultsScrollContent: {
    paddingBottom: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultRowPressed: {
    backgroundColor: "#F3F4F6",
  },
  resultTitle: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  resultSection: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
  noResults: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  contactSupportButton: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactSupportButtonPressed: {
    backgroundColor: "#374151",
  },
  contactSupportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  browseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipPressed: {
    backgroundColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
});
