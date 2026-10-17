import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

type P = { size?: number; color: string; strokeWidth?: number };

export function HomeIcon({ size = 24, color, strokeWidth = 1.8 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

export function BallIcon({ size = 24, color, strokeWidth = 1.8 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Polygon points="12,7.6 15.6,10.2 14.2,14.4 9.8,14.4 8.4,10.2" fill={color} />
      <Path d="M12 7.6V3.2M15.6 10.2l4-1.6M14.2 14.4l2.6 3.8M9.8 14.4l-2.6 3.8M8.4 10.2l-4-1.6" />
    </Svg>
  );
}

export function HockeyIcon({ size = 24, color, strokeWidth = 1.8 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 3l7.5 13.5H17a1.5 1.5 0 0 1 0 3h-5.5L3.5 5" />
      <Path d="M19 3l-4.2 7.6" />
      <Rect x={5} y={18} width={5} height={2.6} rx={1.3} fill={color} />
    </Svg>
  );
}

export function TrophyIcon({ size = 24, color, strokeWidth = 1.8 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <Path d="M8 6H5a3 3 0 0 0 3 3.5M16 6h3a3 3 0 0 1-3 3.5M12 13v4M8.5 20h7M10 17h4" />
    </Svg>
  );
}

export function UsersIcon({ size = 24, color, strokeWidth = 1.8 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8.5} r={3.5} />
      <Path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <Circle cx={16.5} cy={9} r={2.6} />
      <Path d="M16.5 14c2.6 0 4.5 1.8 4.5 4.6" />
    </Svg>
  );
}

export function ChevronRight({ size = 16, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function ChevronLeft({ size = 20, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 6l-6 6 6 6" />
    </Svg>
  );
}

export function TriangleIcon({ dir, color, size = 8 }: { dir: 'up' | 'down'; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Polygon points={dir === 'up' ? '5,1 9.5,9 0.5,9' : '0.5,1 9.5,1 5,9'} fill={color} />
    </Svg>
  );
}

export function ClockIcon({ size = 14, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2.5 2M9.5 2.5h5" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function MinusIcon({ size = 18, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
      <Path d="M5 12h14" />
    </Svg>
  );
}

export function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2c1 3.5 5 5.8 5 11a5 5 0 0 1-10 0c0-2.6 1.4-4.2 2.6-5.4.2 1.7 1 2.8 2.1 3.3C11 8.4 11.3 5 12 2z" fill="#F26B1D" />
      <Path d="M12 13c.6 1.6 2.3 2.4 2.3 4.4a2.3 2.3 0 0 1-4.6 0c0-1.4.9-2.3 2.3-4.4z" fill="#FFC23D" />
    </Svg>
  );
}
