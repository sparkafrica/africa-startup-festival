import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { CloseIcon, ChevronRightIcon } from "../components/MenuIcons";
import {
  TAG_PICKUP_BRANCHES,
  TAG_PICKUP_INTRO,
  TAG_PICKUP_OPENING_HOURS,
  type TagPickupBranch,
} from "../constants/tagPickupBranches";
import { openMapsUrl } from "../utils/maps";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "../theme/theme";

const BRAND_GREEN = "#1BB273";

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tag Pickup</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
        hitSlop={10}
      >
        <CloseIcon size={20} color={colors.text.primary} />
      </Pressable>
    </View>
  );
}

function BranchCard({ branch }: { branch: TagPickupBranch }) {
  const openDirections = () => {
    void openMapsUrl(branch.mapsUrl);
  };

  return (
    <Pressable
      onPress={openDirections}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <Text style={styles.branchName}>{branch.name}</Text>
        <Text style={styles.branchAddress}>{branch.address}</Text>
        <View style={styles.directionsRow}>
          <Text style={styles.directionsLabel}>Get directions</Text>
          <ChevronRightIcon size={18} color={BRAND_GREEN} />
        </View>
      </View>
    </Pressable>
  );
}

export default function TagPickupScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <Header />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>{TAG_PICKUP_INTRO}</Text>

          {TAG_PICKUP_BRANCHES.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}

          <View style={styles.hoursBlock}>
            <Text style={styles.hoursTitle}>Opening Hours</Text>
            {TAG_PICKUP_OPENING_HOURS.map((row) => (
              <View key={row.label} style={styles.hoursRow}>
                <Text style={styles.hoursLabel}>{row.label}</Text>
                <Text style={styles.hoursValue}>{row.hours}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-bold"],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  intro: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.inter,
    marginBottom: spacing[6],
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[4],
    overflow: "hidden",
    ...shadows.base,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardAccent: {
    width: 4,
    backgroundColor: BRAND_GREEN,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  branchName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-semibold"],
    marginBottom: spacing[2],
  },
  branchAddress: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.inter,
    marginBottom: spacing[3],
  },
  directionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  directionsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: BRAND_GREEN,
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  hoursBlock: {
    marginTop: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  hoursTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-semibold"],
    marginBottom: spacing[3],
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  hoursLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.inter,
  },
  hoursValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-medium"],
  },
});
