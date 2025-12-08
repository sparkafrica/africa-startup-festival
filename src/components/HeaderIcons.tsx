import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function ScanIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3 3H7V5H5V7H3V3Z" fill={color} />
      <Path d="M13 3H17V7H15V5H13V3Z" fill={color} />
      <Path d="M3 13H5V15H7V17H3V13Z" fill={color} />
      <Path d="M15 13H17V17H13V15H15V13Z" fill={color} />
      <Rect x="9" y="2" width="2" height="16" fill={color} />
      <Rect x="2" y="9" width="16" height="2" fill={color} />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 2C8.34315 2 7 3.34315 7 5V9.58579L4.70711 11.8787C4.31658 12.2692 4 12.9017 4 13.4142V14H16V13.4142C16 12.9017 15.6834 12.2692 15.2929 11.8787L13 9.58579V5C13 3.34315 11.6569 2 10 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M8 16H12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18C10.5523 18 11 17.5523 11 17H9C9 17.5523 9.44772 18 10 18Z"
        fill={color}
      />
    </Svg>
  );
}

export function MenuIcon({ size = 20, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M3 5H17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 10H17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 15H17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
