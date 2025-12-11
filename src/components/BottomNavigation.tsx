import React from "react";
import { View, Pressable, Text } from "react-native";

interface BottomNavItem {
  icon: (active: boolean) => React.ReactNode;
  label: string;
  route: string;
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
        {items.map((item, idx) => {
          const isActive = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => onNavigate(item.route)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                // Avoid horizontal padding for even distribution
              }}
            >
              {item.icon(isActive)}
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
