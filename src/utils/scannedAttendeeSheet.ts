import { useCallback } from "react";
import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Attendee } from "../services/ticketService";

export const SCANNED_ATTENDEE_SHEET_HEIGHT_RATIO = 0.7;

const DISMISS_DRAG_THRESHOLD = 110;
const DISMISS_VELOCITY = 750;

export function getScannedAttendeeSheetHeight(
  screenHeight = Dimensions.get("window").height,
): number {
  return screenHeight * SCANNED_ATTENDEE_SHEET_HEIGHT_RATIO;
}

/** Dev-only: inspect scan / directory payloads for startup admin fields. */
export function logScannedAttendeePayload(
  source: string,
  attendee: Attendee | null | undefined,
): void {
  if (!__DEV__ || !attendee) return;

  const user = attendee.user as Record<string, unknown> | undefined;
  const company = user?.company as Record<string, unknown> | null | undefined;

  console.log(
    `[ScannedAttendee:${source}]`,
    JSON.stringify(
      {
        userId: user?.id,
        ticketType: attendee.ticket?.type?.name,
        company,
        companyKeys: company ? Object.keys(company) : [],
        hasAdminUser: company?.admin_user != null,
        adminUser: company?.admin_user ?? null,
        companyType: company?.company_type ?? null,
        organisation: user?.organisation ?? null,
        organisationRole: user?.organisation_role ?? null,
        metadata: user?.metadata ?? null,
      },
      null,
      2,
    ),
  );

  // Temporary: full raw payloads to find company/admin under alternate field names.
  console.log(
    `[ScannedAttendee:${source}:attendee-root-keys]`,
    Object.keys(attendee as object),
  );
  console.log(
    `[ScannedAttendee:${source}:user-keys]`,
    user ? Object.keys(user) : [],
  );
  console.log(
    `[ScannedAttendee:${source}:raw-user]`,
    JSON.stringify(user ?? null, null, 2),
  );
  console.log(
    `[ScannedAttendee:${source}:raw-attendee]`,
    JSON.stringify(attendee, null, 2),
  );
}

export function useScannedAttendeeSheetDismiss(onDismiss: () => void) {
  const translateY = useSharedValue(0);
  const isClosing = useSharedValue(false);
  const screenHeight = Dimensions.get("window").height;

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(6)
    .failOffsetX([-24, 24])
    .onUpdate((event) => {
      if (isClosing.value) return;
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (isClosing.value) return;

      const shouldDismiss =
        event.translationY > DISMISS_DRAG_THRESHOLD ||
        event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        isClosing.value = true;
        translateY.value = withTiming(screenHeight, { duration: 240 }, (finished) => {
          if (!finished) return;
          translateY.value = 0;
          isClosing.value = false;
          runOnJS(dismiss)();
        });
        return;
      }

      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 220,
        mass: 0.85,
      });
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const resetSheet = useCallback(() => {
    translateY.value = 0;
    isClosing.value = false;
  }, [translateY, isClosing]);

  return { panGesture, sheetAnimatedStyle, resetSheet };
}
