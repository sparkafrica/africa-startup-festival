/**
 * ASF2026 ticket upgrade modal.
 * Select target tier → choose Korapay (KES) or Stripe (USD) → redirect to payment_url.
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
import {
  ticketService,
  UPGRADE_PAYMENT_METHODS,
  type UpgradePaymentMethod,
} from "../services/ticketService";
import { ApiClientError } from "../services/api";
import {
  getTicketBackgroundColor,
  getTicketGradientColors,
} from "../utils/ticketColors";
import {
  ASF_UPGRADE_TIER_ORDER_LABEL,
  filterUpgradeClasses,
} from "../utils/ticketUpgrade";
import { colors, typography, spacing, borderRadius } from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { getTicketBenefits } from "../constants/ticketBenefits";
import { trackEvent } from "../utils/analytics";
import TicketBenefitsModal from "./TicketBenefitsModal";

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
  const [selectedTicketClassId, setSelectedTicketClassId] = useState<
    number | null
  >(null);
  const [paymentMethod, setPaymentMethod] =
    useState<UpgradePaymentMethod>("KORAPAY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const sorted = filterUpgradeClasses(classes, currentTierLabel);
      const options = sorted.map((c) => ({
        ticket_class_id: c.id,
        value: (c.name || c.user_type || "").toLowerCase(),
        label: c.name || c.user_type || "Ticket",
      }));
      setUpgradeOptions(options);
      setSelectedTicketClassId(
        options.length > 0 ? options[0].ticket_class_id : null,
      );
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load ticket options.";
      setClassesError(msg);
    } finally {
      setClassesLoading(false);
    }
  }, [eventId, currentTierLabel]);

  useEffect(() => {
    if (visible && eventId) {
      setError(null);
      setPaymentMethod("KORAPAY");
      void fetchClasses();
    }
    if (!visible) {
      setFullBenefitsTarget(null);
    }
  }, [visible, eventId, fetchClasses]);

  const selectedOption = upgradeOptions.find(
    (o) => o.ticket_class_id === selectedTicketClassId,
  );
  const selectedLabel = selectedOption?.label ?? "";
  const selectedCurrency =
    UPGRADE_PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.currency ??
    "KES";

  const handleUpgrade = async () => {
    if (selectedTicketClassId == null) return;
    setError(null);
    setLoading(true);
    try {
      const result = await ticketService.upgradeTicket(
        eventId,
        ticketId,
        selectedTicketClassId,
        paymentMethod,
        selectedCurrency,
      );
      const paymentUrl = result?.payment_url;
      const amount = result?.amount ?? "";
      void trackEvent("ticket_upgrade_initiated", {
        from_tier: currentTierLabel,
        to_tier: selectedLabel,
        payment_method: paymentMethod,
        currency: selectedCurrency,
      });
      if (paymentUrl) {
        onSuccess();
        onClose();
        const amountLine =
          amount !== ""
            ? `Amount to pay: ${amount} ${selectedCurrency}.`
            : "";
        Alert.alert(
          "Complete payment",
          `${amountLine} You will be redirected to complete payment.`.trim(),
          [
            { text: "Later", style: "cancel" },
            { text: "Open payment", onPress: () => Linking.openURL(paymentUrl) },
          ],
        );
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
                    `${k}: ${Array.isArray(v) ? (v as unknown[]).join(", ") : v}`,
                )
              : [String(errList)];
          if (parts.length) message = `${message}\n\n${parts.join("\n")}`;
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
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Upgrade your ticket</Text>
            <Text style={styles.subtitle}>
              You have a {currentTierLabel} pass. Choose the pass you want to
              upgrade to.
            </Text>
            <View style={styles.tierInfo}>
              <Text style={styles.tierInfoLabel}>Ticket tiers</Text>
              <Text style={styles.tierOrder}>{ASF_UPGRADE_TIER_ORDER_LABEL}</Text>
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
                    const isSelected =
                      selectedTicketClassId === opt.ticket_class_id;
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
                        {benefits ? (
                          <Pressable
                            onPress={() => {
                              setFullBenefitsTarget({
                                tierLabel: benefits.tierLabel,
                                items: benefits.items,
                                ticketType: opt.value,
                              });
                              void trackEvent("ticket_upgrade_benefits_viewed", {
                                source: "upgrade_modal",
                                from_tier: currentTierLabel,
                                to_tier: opt.label,
                              });
                            }}
                            hitSlop={8}
                            style={styles.viewBenefitsLink}
                          >
                            <Text style={styles.viewBenefitsText}>
                              View benefits
                            </Text>
                            <Text style={styles.viewBenefitsArrow}>↓</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {!classesLoading && upgradeOptions.length > 0 ? (
              <>
                <Text style={styles.chooseLabel}>Payment method</Text>
                <View style={styles.paymentList}>
                  {UPGRADE_PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.value;
                    return (
                      <Pressable
                        key={method.value}
                        onPress={() => setPaymentMethod(method.value)}
                        style={({ pressed }) => [
                          styles.paymentMethodRow,
                          isSelected && styles.paymentMethodRowSelected,
                          pressed && styles.paymentMethodRowPressed,
                        ]}
                      >
                        <View style={styles.paymentMethodLeft}>
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && {
                                borderColor: colors.text.primary,
                              },
                            ]}
                          >
                            {isSelected ? (
                              <View
                                style={[
                                  styles.radioInner,
                                  { backgroundColor: colors.text.primary },
                                ]}
                              />
                            ) : null}
                          </View>
                          <Text style={styles.paymentMethodLabel}>
                            {method.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleUpgrade()}
              disabled={classesLoading || upgradeOptions.length === 0 || loading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                (classesLoading || upgradeOptions.length === 0 || loading) &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {upgradeOptions.length === 0
                    ? "No upgrade options"
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "92%",
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  mainScroll: {
    flexGrow: 0,
  },
  mainScrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
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
  paymentList: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.background,
  },
  paymentMethodRowSelected: {
    borderColor: colors.text.primary,
    backgroundColor: colors.neutral[50],
  },
  paymentMethodRowPressed: {
    opacity: 0.8,
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
    color: colors.text.primary,
    fontFamily: typography.fontFamily["inter-medium"],
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
  primaryButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
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
    marginBottom: spacing[2],
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
  },
});
