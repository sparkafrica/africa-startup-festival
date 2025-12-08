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
    <View className="bg-white border-t border-neutral-200 px-4 py-2">
      <View className="flex-row items-center justify-around">
        {items.map((item) => {
          const isActive = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => onNavigate(item.route)}
              className="items-center justify-center py-2 px-4"
            >
              {item.icon(isActive)}
              <Text
                className={`text-xs mt-1 ${
                  isActive ? "text-black" : "text-neutral-400"
                }`}
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
