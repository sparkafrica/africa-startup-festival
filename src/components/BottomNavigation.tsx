import React from "react";
import { View, Pressable, Text } from "react-native";

interface BottomNavItem {
  icon: (active: boolean) => React.ReactNode;
  label: string;
  route: string;
  /** Optional badge count (e.g. meetings needing attention). Shown at top-right of icon. */
  badge?: number;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export default function BottomNavigation({
  items,
  activeRoute,
  onNavigate,
}: BottomNavigationProps) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e5e5",
        paddingVertical: 8,
        paddingHorizontal: 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          width: "100%",
        }}
      >
        {items.map((item) => {
          const isActive = activeRoute === item.route;
          const showBadge =
            item.badge !== undefined && item.badge > 0;
          const badgeLabel =
            item.badge! > 99 ? "99+" : String(item.badge);
          return (
            <Pressable
              key={item.route}
              onPress={() => onNavigate(item.route)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
              }}
            >
              <View style={{ position: "relative" }}>
                {item.icon(isActive)}
                {showBadge && (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -10,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                      numberOfLines={1}
                    >
                      {badgeLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 12,
                  marginTop: 4,
                  color: isActive ? "#000" : "#a3a3a3",
                  textAlign: "center",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
