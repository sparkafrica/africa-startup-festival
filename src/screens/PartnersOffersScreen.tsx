import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { CloseIcon, ChevronRightIcon } from "../components/MenuIcons";
import { LoadingSpinner } from "../components";
import { offerService, type PartnerOffer } from "../services/offerService";
import { ApiClientError } from "../services/api";
import {
  colors,
  borderRadius,
  shadows,
  typography,
  spacing,
} from "../theme/theme";

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Partner Offers</Text>
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

function OfferCard({ offer }: { offer: PartnerOffer }) {
  const openLink = () => {
    if (offer.link) Linking.openURL(offer.link);
  };

  const typeLabel = offer.offer_type
    ? offer.offer_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Offer";

  return (
    <Pressable
      onPress={openLink}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.offerTitle} numberOfLines={2}>
            {offer.title}
          </Text>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{typeLabel}</Text>
          </View>
        </View>
        {offer.description ? (
          <Text style={styles.offerDescription} numberOfLines={2}>
            {offer.description}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.companyName} numberOfLines={1}>
            {offer.company_name || `Company ${offer.company_id}`}
          </Text>
          <ChevronRightIcon size={18} color={colors.neutral[500]} />
        </View>
      </View>
    </Pressable>
  );
}

export default function PartnersOffersScreen() {
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOffers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const list = await offerService.getOffersForEvent();
      setOffers(list);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load offers. Pull to retry.";
      setError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredOffers = searchLower
    ? offers.filter((o) => {
        const titleMatch = (o.title || "").toLowerCase().includes(searchLower);
        const descMatch = (o.description || "").toLowerCase().includes(searchLower);
        const companyMatch = (o.company_name || "").toLowerCase().includes(searchLower);
        const typeMatch = (o.offer_type || "").toLowerCase().includes(searchLower);
        return titleMatch || descMatch || companyMatch || typeMatch;
      })
    : offers;

  const onRefresh = useCallback(() => {
    fetchOffers(true);
  }, [fetchOffers]);

  const hasOffers = offers.length > 0;
  const hasFilteredOffers = filteredOffers.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <Header />

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search offers or companies..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.centered}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => fetchOffers()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : !hasOffers ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No offers yet</Text>
            <Text style={styles.emptySubtext}>
              Check back later for discounts and promos from exhibitors and partners.
            </Text>
          </View>
        ) : !hasFilteredOffers ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtext}>
              Try a different search term or pull to refresh.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.text.primary}
              />
            }
          >
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </ScrollView>
        )}
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
  searchWrap: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[5],
    overflow: "hidden",
    ...shadows.base,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.success,
    borderRadius: 0,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  offerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  typePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  typePillText: {
    fontSize: 11,
    color: "#059669",
    fontFamily: typography.fontFamily["inter-medium"],
  },
  offerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    fontFamily: typography.fontFamily.sans,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.sans,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing[4],
    fontFamily: typography.fontFamily.sans,
  },
  retryButton: {
    backgroundColor: colors.text.primary,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing[2],
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
    fontFamily: typography.fontFamily.sans,
  },
});
