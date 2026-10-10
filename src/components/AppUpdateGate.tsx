import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchAppVersionPolicy,
  getAppUpdateDecision,
  getInstalledNativeBuild,
  type AppUpdateDecision,
} from "../services/appVersionService";
import { openPlatformAppStore } from "../utils/openAppStore";
import { DownloadIcon } from "./HeaderIcons";
import GuidelinePatternOverlay from "./GuidelinePatternOverlay";

const DEFAULT_DELAY_MS = 4000;
const ENTER_DURATION_MS = 380;
const EXIT_DURATION_MS = 260;

/** One evaluation per JS process/cold launch, including logout/login transitions. */
let didEvaluateVersionPolicyThisLaunch = false;

type AppUpdateModalProps = {
  decision: AppUpdateDecision | null;
  onDismiss: () => void;
};

/** Shared premium bottom sheet used by the live gate and temporary Home preview. */
export function AppUpdateModal({
  decision,
  onDismiss,
}: AppUpdateModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(decision !== null);
  const [renderedDecision, setRenderedDecision] =
    useState<AppUpdateDecision | null>(decision);
  const [openingStore, setOpeningStore] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(windowHeight)).current;

  useEffect(() => {
    if (decision) {
      setRenderedDecision(decision);
      setMounted(true);
      backdropOpacity.stopAnimation();
      sheetTranslateY.stopAnimation();
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(windowHeight);

      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: ENTER_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: ENTER_DURATION_MS,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }),
        ]).start();
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!mounted) return;
    backdropOpacity.stopAnimation();
    sheetTranslateY.stopAnimation();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: windowHeight,
        duration: EXIT_DURATION_MS,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [
    decision,
    windowHeight,
    backdropOpacity,
    sheetTranslateY,
  ]);

  const required = renderedDecision?.mode === "required";

  const handleUpdate = async () => {
    if (!renderedDecision || openingStore) return;
    setOpeningStore(true);
    try {
      await openPlatformAppStore(renderedDecision.policy.store_url);
      if (!required) onDismiss();
    } finally {
      setOpeningStore(false);
    }
  };

  const handleDismiss = () => {
    if (!required) onDismiss();
  };

  const sheetHeight = Math.round(windowHeight * (required ? 0.5 : 0.48));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.dimmedBackdrop, { opacity: backdropOpacity }]}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          accessibilityViewIsModal
        >
          <GuidelinePatternOverlay isLightCard opacity={0.05} />
          <SafeAreaView style={styles.safeContent} edges={["bottom"]}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.iconCircle}>
                <DownloadIcon size={25} color="#FFFFFF" />
              </View>

              <Text style={styles.eyebrow}>
                {required ? "UPDATE REQUIRED" : "UPDATE AVAILABLE"}
              </Text>
              <Text style={styles.title}>
                {renderedDecision?.policy.title}
              </Text>
              <Text style={styles.message}>
                {renderedDecision?.policy.message}
              </Text>

              {required && (
                <Text style={styles.requiredNote}>
                  You’ll need the latest version to continue using the app.
                </Text>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={() => void handleUpdate()}
                disabled={openingStore}
                style={({ pressed }) => [
                  styles.updateButton,
                  pressed && styles.buttonPressed,
                  openingStore && styles.buttonDisabled,
                ]}
              >
                {openingStore ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>
                    {Platform.OS === "ios"
                      ? "Update on App Store"
                      : "Update on Google Play"}
                  </Text>
                )}
              </Pressable>

              {!required && (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDismiss}
                  style={({ pressed }) => [
                    styles.laterButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.laterButtonText}>Maybe later</Text>
                </Pressable>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

type AppUpdateGateProps = {
  active: boolean;
  delayMs?: number;
};

export default function AppUpdateGate({
  active,
  delayMs = DEFAULT_DELAY_MS,
}: AppUpdateGateProps) {
  const [decision, setDecision] = useState<AppUpdateDecision | null>(null);

  useEffect(() => {
    if (!active || didEvaluateVersionPolicyThisLaunch) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      didEvaluateVersionPolicyThisLaunch = true;
      void (async () => {
        const policy = await fetchAppVersionPolicy();
        if (cancelled) return;
        setDecision(
          getAppUpdateDecision(policy, getInstalledNativeBuild()),
        );
      })();
    }, delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, delayMs]);

  return (
    <AppUpdateModal
      decision={decision}
      onDismiss={() => setDecision(null)}
    />
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dimmedBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  sheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 24,
  },
  safeContent: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "#000000",
  },
  eyebrow: {
    color: "#3F3F46",
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.15,
    fontFamily: "InterDisplay-Bold",
    marginBottom: 5,
  },
  title: {
    color: "#111111",
    fontSize: 23,
    lineHeight: 28,
    textAlign: "center",
    fontFamily: "InterDisplay-Bold",
  },
  message: {
    maxWidth: 340,
    color: "#525252",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "InterDisplay-Regular",
    marginTop: 7,
    marginBottom: 14,
  },
  requiredNote: {
    width: "100%",
    maxWidth: 380,
    color: "#7C2D12",
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 17,
    fontFamily: "InterDisplay-Medium",
  },
  updateButton: {
    width: "100%",
    maxWidth: 380,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "InterDisplay-SemiBold",
  },
  laterButton: {
    width: "100%",
    maxWidth: 380,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  laterButtonText: {
    color: "#525252",
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "InterDisplay-SemiBold",
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
