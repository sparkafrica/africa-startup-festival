/**
 * Schedule restrictions by ticket tier.
 * ASF v1: no tier-based stage blocks.
 */

import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";

export function isMentorHoursSession(_stage?: string): boolean {
  return false;
}

export async function getCanUserAddMentorHoursToSchedule(): Promise<boolean> {
  return true;
}

export function showMentorHoursScheduleBlockedAlert(
  _navigation: NavigationProp<RootStackParamList>,
): void {
  // No-op for ASF v1
}
