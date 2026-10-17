import { StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import type { Sport } from '@/data/types';
import { lightAccents } from '@/theme/tokens';

/** Header-Hintergrund: grünes Fußballfeld bzw. helle Eisfläche (Draufsicht, angeschnitten). */
export function FieldBackground({ sport, width, height }: { sport: Sport; width: number; height: number }) {
  const a = lightAccents[sport];
  if (sport === 'football') {
    const stripes = Math.ceil(width / 46);
    const cx = width / 2;
    const line = a.fieldLine;
    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect width={width} height={height} fill={a.fieldBase} />
        {Array.from({ length: stripes }).map((_, i) =>
          i % 2 ? <Rect key={i} x={i * 46} width={46} height={height} fill={a.fieldStripe} /> : null,
        )}
        <G stroke={line} strokeWidth={1.6} fill="none">
          <Rect x={18} y={64} width={width - 36} height={height + 40} />
          <Line x1={cx} y1={64} x2={cx} y2={height + 40} />
          <Circle cx={cx} cy={height * 0.82} r={54} />
          <Rect x={18} y={height * 0.42} width={70} height={140} />
          <Rect x={width - 88} y={height * 0.42} width={70} height={140} />
          <Path d={`M88 ${height * 0.62} a30 30 0 0 1 0 60`} />
          <Path d={`M${width - 88} ${height * 0.62} a30 30 0 0 0 0 60`} />
        </G>
        <Circle cx={cx} cy={height * 0.82} r={2.6} fill={line} />
      </Svg>
    );
  }
  const red = 'rgba(214,60,72,0.14)';
  const blue = 'rgba(31,100,200,0.10)';
  const cx = width / 2;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Rect width={width} height={height} fill={a.fieldBase} />
      <Rect x={width * 0.27} width={7} height={height} fill={blue} />
      <Rect x={width * 0.73 - 7} width={7} height={height} fill={blue} />
      <Rect x={cx - 2} width={4} height={height} fill={red} />
      <G stroke={blue} strokeWidth={2.2} fill="none">
        <Circle cx={cx} cy={height * 0.72} r={48} />
      </G>
      <G stroke={red} strokeWidth={2} fill="none">
        <Circle cx={width * 0.06} cy={height * 0.8} r={44} />
        <Circle cx={width * 0.94} cy={height * 0.8} r={44} />
      </G>
      <Circle cx={width * 0.94} cy={height * 0.8} r={4} fill={red} />
      <Circle cx={width * 0.06} cy={height * 0.8} r={4} fill={red} />
    </Svg>
  );
}
