import React from "react";
import { View, Text } from "react-native";

interface StatusTagProps {
  label: string;
  variant?: "pending" | "approved" | "cancelled";
}

export default function StatusTag({
  label,
  variant = "pending",
}: StatusTagProps) {
  const variantStyles = {
    pending: "bg-orange-600",
    approved: "bg-green-500",
    cancelled: "bg-gray-500",
  };

  return (
    <View
      className={`${variantStyles[variant]} rounded-full px-3 py-1 self-start`}
    >
      <Text className="text-white text-xs font-medium">{label}</Text>
    </View>
  );
}
