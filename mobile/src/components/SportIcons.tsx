import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/** Klassischer Fußball: weiß mit schwarzem Fünfeck-/Sechseck-Muster. */
export function FootballIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={22} fill="#FFFFFF" stroke="#111" strokeWidth={2.2} />
      <G fill="#111">
        <Path d="M24 15.5l8.1 5.9-3.1 9.5H19l-3.1-9.5z" />
        <Path d="M24 2.2c3.2 0 6.3.7 9 2l-1.2 4.6L24 11.6l-7.8-2.8L15 4.2c2.7-1.3 5.8-2 9-2z" />
        <Path d="M45.5 21.6c.4 3.3 0 6.6-1.1 9.6l-4.7.3-4.4-5.9 2.6-8.1 4.4-1.7c1.6 1.8 2.6 3.7 3.2 5.8z" />
        <Path d="M2.5 21.6c-.4 3.3 0 6.6 1.1 9.6l4.7.3 4.4-5.9-2.6-8.1-4.4-1.7C4.1 17.6 3.1 19.5 2.5 21.6z" />
        <Path d="M12.6 42.7c-2.8-1.7-5.1-4-6.8-6.8l2.8-3.5 7.2 1.1 3.6 6.7-1.6 3.9c-1.8-.3-3.6-.8-5.2-1.4z" />
        <Path d="M35.4 42.7c2.8-1.7 5.1-4 6.8-6.8l-2.8-3.5-7.2 1.1-3.6 6.7 1.6 3.9c1.8-.3 3.6-.8 5.2-1.4z" />
      </G>
      <G stroke="#111" strokeWidth={1.6} strokeLinecap="round">
        <Path d="M24 11.6v3.9M32.1 21.4l5.1-2.1M29 30.9l3.2 2.6M19 30.9l-3.2 2.6M15.9 21.4l-5.1-2.1" />
      </G>
    </Svg>
  );
}

/** Eishockey-Puck: schwarzer Zylinder in leichter Schrägansicht mit geriffeltem Rand. */
export function PuckIcon({ size = 24 }: { size?: number }) {
  const ridges = [9, 13.5, 18, 22.5, 27, 31.5, 36, 40.5];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M3 19v10c0 5.5 9.4 10 21 10s21-4.5 21-10V19z" fill="#1B1D21" />
      <G stroke="#4A4E56" strokeWidth={1.6}>
        {ridges.map((x) => {
          const t = (x - 24) / 21;
          const y = 19 + 10 * Math.sqrt(Math.max(0, 1 - t * t)) * 0.95;
          return <Path key={x} d={`M${x} ${y + 1.5}v7.5`} />;
        })}
      </G>
      <Ellipse cx={24} cy={19} rx={21} ry={10} fill="#2B2E34" stroke="#111" strokeWidth={1.4} />
      <Ellipse cx={24} cy={19} rx={14} ry={6} fill="none" stroke="#3B3F46" strokeWidth={1.2} />
      <Rect x={3} y={28.5} width={0} height={0} />
    </Svg>
  );
}

export function SportGlyph({ sport, size }: { sport: 'football' | 'hockey'; size?: number }) {
  return sport === 'football' ? <FootballIcon size={size} /> : <PuckIcon size={size} />;
}
