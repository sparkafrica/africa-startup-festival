/**
 * Schedule restrictions by ticket tier.
 * ASF v1: no tier-based stage blocks.
 */

import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";

export function isEnterpriseStageSession(_stage?: string): boolean {
  return false;
}

export async function getCanUserAddEnterpriseStageToSchedule(): Promise<boolean> {
  return true;
}

export function showEnterpriseStageScheduleBlockedAlert(
  _navigation: NavigationProp<RootStackParamList>,
): void {
  // No-op for ASF v1
}
