import React from 'react';
import { Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function GridIcon({ size = 20, color = '#404040', className = '' }: IconProps) {
  return (
    <Text className={className} style={{ fontSize: size, color }}>
      ⊞
    </Text>
  );
}

export function BellIcon({ size = 20, color = '#404040', className = '' }: IconProps) {
  return (
    <Text className={className} style={{ fontSize: size, color }}>
      🔔
    </Text>
  );
}

export function MenuIcon({ size = 20, color = '#404040', className = '' }: IconProps) {
  return (
    <Text className={className} style={{ fontSize: size, color }}>
      ☰
    </Text>
  );
}

export function HomeIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: active ? '#0284C7' : '#A3A3A3' }}>
      {active ? '🏠' : '🏛️'}
    </Text>
  );
}

export function PeopleIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: active ? '#0284C7' : '#A3A3A3' }}>
      👥
    </Text>
  );
}

export function CalendarIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: active ? '#0284C7' : '#A3A3A3' }}>
      📅
    </Text>
  );
}

export function ClockIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: active ? '#0284C7' : '#A3A3A3' }}>
      🕐
    </Text>
  );
}

export function HeartIcon({ active = false, size = 24 }: { active?: boolean; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: active ? '#0284C7' : '#A3A3A3' }}>
      👍
    </Text>
  );
}

export function ChevronUpIcon({ size = 16, color = '#A3A3A3' }: IconProps) {
  return (
    <Text style={{ fontSize: size, color }}>
      ⌃
    </Text>
  );
}

export function ChevronDownIcon({ size = 16, color = '#A3A3A3' }: IconProps) {
  return (
    <Text style={{ fontSize: size, color }}>
      ⌄
    </Text>
  );
}

export function ArrowRightIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <Text style={{ fontSize: size, color }}>
      →
    </Text>
  );
}

export function ArrowUpRightIcon({ size = 16, color = '#FFFFFF' }: IconProps) {
  return (
    <Text style={{ fontSize: size, color }}>
      ↗
    </Text>
  );
}

