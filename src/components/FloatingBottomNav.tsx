import React from "react";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** iOS: sit closer to the home indicator than full safe-area inset. */
const IOS_FLOATING_NAV_BOTTOM_GAP = 20;
const ANDROID_FLOATING_NAV_BOTTOM_GAP = 12;

/** Space for scroll content above the floating pill. */
export const FLOATING_NAV_BOTTOM_INSET = 96;

export interface FloatingBottomNavItem {
  route: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
}

export interface FloatingBottomNavProps {
  items: FloatingBottomNavItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  /** Visually hide + disable taps while keeping mounted (no remount flash). */
  hidden?: boolean;
}

export default function FloatingBottomNav({
  items,
  activeRoute,
  onNavigate,
  hidden = false,
}: FloatingBottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomPad =
    Platform.OS === "ios"
      ? IOS_FLOATING_NAV_BOTTOM_GAP
      : Math.max(insets.bottom + ANDROID_FLOATING_NAV_BOTTOM_GAP);

  return (
    <View
      style={[styles.host, hidden && styles.hidden]}
      pointerEvents={hidden ? "none" : "box-none"}
    >
      <View pointerEvents="box-none" style={[styles.safe, { paddingBottom: bottomPad }]}>
        <View style={styles.pill}>
          {items.map((item) => {
            const isActive = activeRoute === item.route;
            const showBadge = item.badge !== undefined && item.badge > 0;
            const badgeLabel =
              item.badge! > 99 ? "99+" : String(item.badge);

            return (
              <Pressable
                key={item.route}
                onPress={() => onNavigate(item.route)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <View style={styles.iconWrap}>
                  {item.icon(isActive)}
                  {showBadge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {badgeLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[styles.label, isActive && styles.labelActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  hidden: {
    opacity: 0,
  },
  safe: {
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 40,
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: "#F5F5F5",
  },
  tabPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    color: "#A3A3A3",
    textAlign: "center",
  },
  labelActive: {
    color: "#000000",
    fontWeight: "600",
  },
});
