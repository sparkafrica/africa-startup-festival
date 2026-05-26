/**
 * Upgrade Ticket Modal – single step for ATE2026 (Paystack only).
 * 1) Select new ticket tier, tap "Upgrade to [tier]" → upgrade runs with Paystack and user is redirected to payment link.
 * Other payment methods have been removed; only Paystack is used.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ticketService, type TicketClass } from "../services/ticketService";

/** ATE2026: Paystack only. Value sent to backend as payment_method. */
const PAYSTACK_METHOD = "PAYSTACK";
import { ApiClientError } from "../services/api";
import { getTicketBackgroundColor, getTicketGradientColors } from "../utils/ticketColors";
import { colors, typography, spacing, borderRadius } from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { getTicketBenefits } from "../constants/ticketBenefits";
import { trackEvent } from "../utils/analytics";
import TicketBenefitsModal from "./TicketBenefitsModal";

const TIER_ORDER = "Limited Pass → Expo → Oasis → Delegate → Chairperson";

/** Tier sort order (lowest to highest): Expo=0, Oasis=1, Delegate=2, Chairperson=3 */
function tierSortKey(nameOrType?: string): number {
  const t = (nameOrType ?? "").toLowerCase();
  // Lowest → highest
  if (t.includes("chairperson") || t.includes("founder")) return 4;
  if (t.includes("delegate")) return 3;
  if (t.includes("oasis")) return 2;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general")) return 1;
  if (t.includes("exhibition")) return 0;
  return 0; // unknown -> treat as lowest for upgrade ordering
}

/**
 * Filter ticket classes to upgrade targets only (Oasis, Delegate, Chairperson),
 * then keep only tiers strictly above the user's current tier (no same-tier or downgrade).
 * Deduplicates by tier label so production APIs that return duplicate classes don't show repeated options.
 * - Exhibition (0) → Expo, Oasis, Delegate, Chairperson
 * - Expo (1) → Oasis, Delegate, Chairperson
 * - Oasis (2) → Delegate, Chairperson
 * - Delegate (3) → Chairperson only
 * - Chairperson (4) → none
 */
function filterAndSortUpgradeClasses(
  classes: TicketClass[],
  currentTierLabel: string
): TicketClass[] {
  const userTierKey = tierSortKey(currentTierLabel);
  const filtered = classes
    .filter((c) => {
      const tierKey = tierSortKey(c.name || c.user_type);
      return tierKey > 0 && tierKey > userTierKey;
    })
    .sort((a, b) => tierSortKey(a.name || a.user_type) - tierSortKey(b.name || b.user_type));
  // Deduplicate by tier label (production backend may return multiple classes per tier name)
  const seen = new Set<string>();
  return filtered.filter((c) => {
    const label = (c.name || c.user_type || "").toLowerCase();
    if (seen.has(label)) return false;
    seen.add(label);
    return true;
  });
}

export interface UpgradeTicketModalProps {
  visible: boolean;
  onClose: () => void;
  currentTierLabel: string;
  ticketId: number;
  eventId: number;
  onSuccess: () => void;
}

export default function UpgradeTicketModal({
  visible,
  onClose,
  currentTierLabel,
  ticketId,
  eventId,
  onSuccess,
}: UpgradeTicketModalProps) {
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<
    { ticket_class_id: number; value: string; label: string }[]
  >([]);
  const [selectedTicketClassId, setSelectedTicketClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Nested full-benefits modal target (when user taps "View benefits" on a row). */
  const [fullBenefitsTarget, setFullBenefitsTarget] = useState<{
    tierLabel: string;
    items: string[];
    ticketType?: string;
  } | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!eventId) return;
    setClassesLoading(true);
    setClassesError(null);
    try {
      const classes = await ticketService.getTicketClasses(eventId);
      const sorted = filterAndSortUpgradeClasses(classes, currentTierLabel);
      const options = sorted.map((c) => ({
        ticket_class_id: c.id,
        // Use name first for value so color lookup gets "oasis"/"delegate"/"chairperson" (name), not generic user_type e.g. "attendee"
        value: (c.name || c.user_type || "").toLowerCase(),
        label: c.name || c.user_type || "Ticket",
      }));
      setUpgradeOptions(options);
      // Always set selection to first available option (only higher tiers are in the list)
      setSelectedTicketClassId(options.length > 0 ? options[0].ticket_class_id : null);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : "Failed to load ticket options.";
      setClassesError(msg);
    } finally {
      setClassesLoading(false);
    }
  }, [eventId, currentTierLabel]);

  useEffect(() => {
    if (visible && eventId) {
      setError(null);
      fetchClasses();
    }
    if (!visible) {
      setFullBenefitsTarget(null);
    }
  }, [visible, eventId, fetchClasses]);

  const selectedOption = upgradeOptions.find(
    (o) => o.ticket_class_id === selectedTicketClassId
  );
  const selectedLabel = selectedOption?.label ?? "";

  const handleUpgrade = async (paymentMethod: string) => {
    if (selectedTicketClassId == null) return;
    setError(null);
    setLoading(true);
    const currency = "NGN";
    try {
      const result = await ticketService.upgradeTicket(
        eventId,
        ticketId,
        selectedTicketClassId,
        paymentMethod,
        currency
      );
      const paymentUrl = result?.payment_url;
      const amount = result?.amount ?? "";
      if (paymentUrl) {
        onSuccess();
        onClose();
        const message =
          amount !== ""
            ? `Amount to pay: ${amount}. You will be redirected to complete payment.`
            : "You will be redirected to complete payment.";
        Alert.alert("Complete payment", message, [
          { text: "Open payment", onPress: () => Linking.openURL(paymentUrl) },
          { text: "Later" },
        ]);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      let message = "Upgrade failed. Please try again.";
      if (err instanceof ApiClientError) {
        message = err.message || message;
        const d = err.data;
        const errList = d?.errors ?? d?.data?.errors;
        if (errList != null) {
          const parts =
            typeof errList === "object" && !Array.isArray(errList)
              ? Object.entries(errList).map(
                  ([k, v]) =>
                    `${k}: ${Array.isArray(v) ? (v as any[]).join(", ") : v}`
                )
              : [String(errList)];
          if (parts.length) message = message + "\n\n" + parts.join("\n");
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {(
            <>
              <Text style={styles.title}>Upgrade your ticket</Text>
              <Text style={styles.subtitle}>
                You have a {currentTierLabel} pass. Choose the pass you want to upgrade to.
              </Text>
              <View style={styles.tierInfo}>
                <Text style={styles.tierInfoLabel}>Ticket tiers</Text>
                <Text style={styles.tierOrder}>{TIER_ORDER}</Text>
              </View>
              {classesLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.text.primary} />
                  <Text style={styles.loadingText}>Loading ticket options...</Text>
                </View>
              ) : classesError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{classesError}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.chooseLabel}>Upgrade to</Text>
                  <View style={styles.options}>
                    {upgradeOptions.map((opt) => {
                      const isSelected = selectedTicketClassId === opt.ticket_class_id;
                      const tierColor = getTicketBackgroundColor(opt.value);
                      const gradientColors = getTicketGradientColors(opt.value);
                      const benefits = getTicketBenefits(opt.value);
                      return (
                        <View
                          key={opt.ticket_class_id}
                          style={[
                            styles.optionRow,
                            isSelected && {
                              borderColor: tierColor,
                              backgroundColor: colors.neutral[50],
                            },
                          ]}
                        >
                          {isSelected ? (
                            <LinearGradient
                              colors={gradientColors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.optionRowAccent}
                            />
                          ) : null}
                          <Pressable
                            onPress={() =>
                              setSelectedTicketClassId(opt.ticket_class_id)
                            }
                            style={styles.optionRowSelectArea}
                          >
                            <View
                              style={[
                                styles.radioOuter,
                                isSelected && { borderColor: tierColor },
                              ]}
                            >
                              {isSelected ? (
                                <View
                                  style={[
                                    styles.radioInner,
                                    { backgroundColor: tierColor },
                                  ]}
                                />
                              ) : null}
                            </View>
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && {
                                  color: tierColor,
                                  fontWeight: "600",
                                },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                          {benefits && (
                            <Pressable
                              onPress={() => {
                                setFullBenefitsTarget({
                                  tierLabel: benefits.tierLabel,
                                  items: benefits.items,
                                  ticketType: opt.value,
                                });
                                void trackEvent(
                                  "ticket_upgrade_benefits_viewed",
                                  {
                                    source: "upgrade_modal",
                                    from_tier: currentTierLabel,
                                    to_tier: opt.label,
                                  }
                                );
                              }}
                              hitSlop={8}
                              style={styles.viewBenefitsLink}
                            >
                              <Text  style={styles.viewBenefitsText}>
                                View benefits
                              </Text>
                              <Text style={styles.viewBenefitsArrow}>↓</Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  onPress={() => handleUpgrade(PAYSTACK_METHOD)}
                  disabled={classesLoading || upgradeOptions.length === 0}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    (classesLoading || upgradeOptions.length === 0) &&
                      styles.primaryButtonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {upgradeOptions.length === 0
                        ? "No options"
                        : `Upgrade to ${selectedLabel}`}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={onClose}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            </>
          )}
          <SafeAreaView edges={["bottom"]} style={styles.safeBottom} />
        </View>
      </View>
      <TicketBenefitsModal
        visible={fullBenefitsTarget != null}
        onClose={() => setFullBenefitsTarget(null)}
        tierLabel={fullBenefitsTarget?.tierLabel ?? ""}
        items={fullBenefitsTarget?.items ?? []}
        ticketType={fullBenefitsTarget?.ticketType}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-bold"],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
    marginBottom: spacing[5],
  },
  tierInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tierInfoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.sans,
    marginBottom: spacing[2],
  },
  tierOrder: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-medium"],
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  chooseLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-semibold"],
    marginBottom: spacing[3],
  },
  options: {
    marginBottom: spacing[5],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[2],
    overflow: "hidden",
    position: "relative",
  },
  optionRowSelectArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  viewBenefitsLink: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing[2],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  viewBenefitsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily["inter-semibold"],
    paddingTop: 4,
    // textDecorationLine: "underline",
  },
  viewBenefitsArrow: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  optionRowAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[3],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.sans,
  },
  stepHeader: {
    marginBottom: spacing[5],
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    marginBottom: spacing[3],
  },
  backButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-bold"],
    marginBottom: spacing[2],
  },
  stepSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
    marginBottom: spacing[4],
  },
  paymentList: {
    gap: spacing[2],
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.background,
  },
  paymentMethodRowPressed: {
    opacity: 0.8,
  },
  paymentMethodLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-medium"],
  },
  paymentMethodChevron: {
    fontSize: typography.fontSize.lg,
    color: colors.neutral[400],
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontFamily: typography.fontFamily.sans,
  },
  scroll: {
    maxHeight: 160,
  },
  scrollContent: {
    paddingBottom: spacing[10],
  },
  primaryButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[4],
    minHeight: 52,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.inverse,
    fontFamily: typography.fontFamily["inter-semibold"],
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    minHeight: 48,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.sans,
  },
  safeBottom: {
    backgroundColor: colors.background,
    paddingTop: spacing[4],
  },
});
