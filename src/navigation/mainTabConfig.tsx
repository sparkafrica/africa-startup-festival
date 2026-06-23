import React from "react";
import type { RootStackParamList } from "./types";
import {
  HomeIcon,
  HomeIconFilled,
  PeopleIcon,
  PeopleIconFilled,
  CalendarIcon,
  CalendarIconFilled,
  ClockIcon,
  ClockIconFilled,
  HeartIcon,
  HeartIconFilled,
} from "../components/BottomNavIcons";
import type { FloatingBottomNavItem } from "../components/FloatingBottomNav";

export const MAIN_TAB_ROUTES = [
  "Home",
  "Attendees",
  "Schedule",
  "Meetings",
  "Connections",
] as const;

export type MainTabRoute = (typeof MAIN_TAB_ROUTES)[number];

/** Screens that show the floating tab bar (main tabs + Home-adjacent lists). */
export const NAV_VISIBLE_ROUTES: ReadonlyArray<keyof RootStackParamList> = [
  "Home",
  "Attendees",
  "Schedule",
  "Meetings",
  "Connections",
  "Speakers",
  "Exhibitors",
  "Partners",
];

const INACTIVE = "#A3A3A3";
const ACTIVE = "#000000";
const ICON_SIZE = 22;

export function createMainTabItems(
  meetingsBadgeCount: number,
): FloatingBottomNavItem[] {
  return [
    {
      route: "Home",
      label: "Home",
      icon: (active) =>
        active ? (
          <HomeIconFilled size={ICON_SIZE} color={ACTIVE} />
        ) : (
          <HomeIcon size={ICON_SIZE} color={INACTIVE} />
        ),
    },
    {
      route: "Attendees",
      label: "Attendees",
      icon: (active) =>
        active ? (
          <PeopleIconFilled size={ICON_SIZE} color={ACTIVE} />
        ) : (
          <PeopleIcon size={ICON_SIZE} color={INACTIVE} />
        ),
    },
    {
      route: "Schedule",
      label: "Schedule",
      icon: (active) =>
        active ? (
          <CalendarIconFilled size={ICON_SIZE} color={ACTIVE} />
        ) : (
          <CalendarIcon size={ICON_SIZE} color={INACTIVE} />
        ),
    },
    {
      route: "Meetings",
      label: "Meetings",
      icon: (active) =>
        active ? (
          <ClockIconFilled size={ICON_SIZE} color={ACTIVE} />
        ) : (
          <ClockIcon size={ICON_SIZE} color={INACTIVE} />
        ),
      badge: meetingsBadgeCount > 0 ? meetingsBadgeCount : undefined,
    },
    {
      route: "Connections",
      label: "Connections",
      icon: (active) =>
        active ? (
          <HeartIconFilled size={ICON_SIZE} color={ACTIVE} />
        ) : (
          <HeartIcon size={ICON_SIZE} color={INACTIVE} />
        ),
    },
  ];
}

export function resolveActiveTabRoute(
  routeName: string | undefined,
): MainTabRoute {
  if (
    routeName &&
    MAIN_TAB_ROUTES.includes(routeName as MainTabRoute)
  ) {
    return routeName as MainTabRoute;
  }
  return "Home";
}

export function isNavVisibleRoute(routeName: string | undefined): boolean {
  if (!routeName) return false;
  return NAV_VISIBLE_ROUTES.includes(routeName as keyof RootStackParamList);
}
