import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  Pressable,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import type { UserProfile } from "../services/authService";
import { StartupBadge } from "./StartupBadge";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";
import { resolveIndustryLabel } from "../constants/industryAndInterests";
import { COUNTRY_OPTIONS } from "../constants/countries";
import { growthStageLabelFromId } from "../constants/startupGrowthStages";

const LOGO_MARK = require("../assets/images/logo-mark.png");

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function ReadOnlyLinkField({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) {
  if (!url?.trim()) return null;

  const openLink = async () => {
    const trimmed = url.trim();
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const supported = await Linking.canOpenURL(withScheme);
      if (!supported) {
        Alert.alert("Cannot open link", "This website URL is not supported.");
        return;
      }
      await Linking.openURL(withScheme);
    } catch {
      Alert.alert("Cannot open link", "Please check the URL and try again.");
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => void openLink()} accessibilityRole="link">
        <Text style={styles.linkValue} numberOfLines={2}>
          {url.trim()}
        </Text>
      </Pressable>
    </View>
  );
}

export default function StartupMemberDetailsView({
  profile,
  onRefresh,
  refreshing = false,
}: {
  profile?: UserProfile | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const company = profile?.company;
  if (!company?.name) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Startup details are not available yet.</Text>
      </View>
    );
  }

  let metadata = company.metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  const meta = (metadata ?? {}) as Record<string, unknown>;

  const industryLabel = resolveIndustryLabel(
    company.company_sector || meta.industry,
  );

  const countryLabel =
    company.country ||
    COUNTRY_OPTIONS.find(
      (o) => o.id === String(meta.country ?? "").toLowerCase(),
    )?.label;

  const growthStage =
    typeof meta.growth_stage === "string"
      ? meta.growth_stage
      : growthStageLabelFromId(String(meta.growth_stage_id ?? ""));

  const website =
    typeof meta.website === "string" ? meta.website : undefined;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <View style={styles.statusCard}>
        <GuidelinePatternOverlay isLightCard opacity={0.05} />
        <View style={styles.cardInner}>
          <StartupBadge companyName={company.name} />
          <Text style={styles.statusCopy}>
            You're a verified member of this startup. Only the startup admin can
            edit company details — this view is read-only for you.
          </Text>
        </View>
      </View>

      <View style={styles.detailsCard}>
        <GuidelinePatternOverlay isLightCard opacity={0.05} />
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsHeaderText}>Startup details</Text>
        </View>

        <View style={styles.detailsBody}>
          <View style={styles.detailsRow}>
            <View style={styles.detailsCol}>
              <ReadOnlyField label="Startup name" value={company.name} />
              <ReadOnlyField label="Industry" value={industryLabel} />
              <ReadOnlyField label="Country" value={countryLabel} />
            </View>

            {company.logo ? (
              <View style={styles.logoWrap}>
                <Image
                  source={{ uri: company.logo }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>
                  {company.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <ReadOnlyLinkField label="Website" url={website} />
          <ReadOnlyField label="Growth stage" value={growthStage || undefined} />
          <ReadOnlyField
            label="Year founded"
            value={
              meta.year_founded != null
                ? String(meta.year_founded)
                : undefined
            }
          />
          <ReadOnlyField
            label="Description"
            value={company.company_description}
          />
          <ReadOnlyField
            label="The problem"
            value={typeof meta.problem === "string" ? meta.problem : undefined}
          />
          <ReadOnlyField
            label="The solution"
            value={
              typeof meta.solution === "string" ? meta.solution : undefined
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#525252",
  },
  statusCard: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#171717",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
    position: "relative",
  },
  cardInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
    gap: 12,
  },
  statusCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: "#525252",
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: "#171717",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
  },
  detailsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#F5F5F5",
    zIndex: 1,
  },
  detailsHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#171717",
  },
  detailsBody: {
    padding: 16,
    zIndex: 1,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 4,
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoPlaceholderText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#737373",
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#737373",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 24,
    color: "#171717",
  },
  linkValue: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  watermarkWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 8,
    opacity: 0.2,
  },
  watermarkImage: {
    width: 200,
    height: 110,
  },
});
