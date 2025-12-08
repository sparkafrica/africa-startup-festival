import React from 'react';
import { Pressable, View, Text } from 'react-native';
import type { PressableProps } from 'react-native';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon?: React.ReactNode;
  label?: string;
  variant?: 'default' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const circularClasses = variant === 'circular' ? 'rounded-full' : 'rounded-lg';

  if (label) {
    return (
      <Pressable
        className={`flex-row items-center justify-center ${circularClasses} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {icon && <View className="mr-1">{icon}</View>}
        <Text className="text-sm font-medium text-neutral-900">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={`items-center justify-center ${circularClasses} ${sizeClasses[size]} bg-neutral-100 ${className}`}
      {...props}
    >
      {icon}
    </Pressable>
  );
}

