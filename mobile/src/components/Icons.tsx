import type React from "react";
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

const S = ({ size = 20, color, strokeWidth = 2, children }: P & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);

export const CheckIcon = (p: P) => <S strokeWidth={2.6} {...p}><Path d="M5 12.5l4.5 4.5L19 7.5" /></S>;
export const XIcon = (p: P) => <S strokeWidth={2.4} {...p}><Path d="M6 6l12 12M18 6L6 18" /></S>;
export const InfoIcon = (p: P) => <S {...p}><Circle cx={12} cy={12} r={9} /><Path d="M12 11v5M12 8h.01" /></S>;
export const PencilIcon = (p: P) => <S {...p}><Path d="M4 20h4L19 9l-4-4L4 16z" /><Path d="M13.5 6.5l4 4" /></S>;
export const BellIcon = (p: P) => <S {...p}><Path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><Path d="M10 20.5a2 2 0 0 0 4 0" /></S>;
export const ShieldIcon = (p: P) => <S {...p}><Path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" /></S>;
export const LogoutIcon = (p: P) => <S {...p}><Path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><Path d="M10 8l-4 4 4 4M6 12h10" /></S>;
export const KeyIcon = (p: P) => <S {...p}><Circle cx={7.5} cy={15.5} r={3.5} /><Path d="M10 13l9-9M16 7l2.5 2.5M14 9l2 2" /></S>;
export const ShareIcon = (p: P) => <S {...p}><Path d="M12 15V4M8 8l4-4 4 4" /><Path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></S>;
export const CalendarIcon = (p: P) => <S {...p}><Rect x={4} y={5} width={16} height={15} rx={2.5} /><Path d="M4 10h16M8.5 3v4M15.5 3v4" /></S>;

export function StarIcon({ size = 22, color, filled }: P & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.8} strokeLinejoin="round">
      <Path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z" />
    </Svg>
  );
}

export function AppleIcon({ size = 20, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z" />
    </Svg>
  );
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <Path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </Svg>
  );
}
