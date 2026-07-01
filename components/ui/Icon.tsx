// components/ui/Icon.tsx
// Crisp, dependency-free SVG icon set (uses react-native-svg). Renders identically
// on iOS / Android / web — replaces unicode glyphs that showed as empty boxes.

import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { Colors } from '../../constants/theme';

export type IconName =
  | 'heart' | 'heartFill' | 'chat' | 'mail' | 'book' | 'user' | 'spark'
  | 'gear' | 'chevronRight' | 'chevronLeft' | 'camera' | 'lock'
  | 'check' | 'close' | 'edit' | 'filter' | 'search' | 'plus'
  | 'send' | 'crown' | 'bell' | 'logout' | 'arrowRight' | 'key' | 'more'
  | 'bolt' | 'ban' | 'inbox' | 'graduation' | 'handshake' | 'sparkles' | 'ruler';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** stroke width for line icons */
  weight?: number;
  /** fill colour for solid icons (heartFill, spark, crown) */
  fill?: string;
}

export default function Icon({
  name,
  size = 24,
  color = Colors.textPrimary,
  weight = 2,
  fill,
}: Props) {
  const stroke = {
    stroke: color,
    strokeWidth: weight,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
  const solid = { fill: fill ?? color };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'heart' && (
        <Path d="M12 20.5C12 20.5 3.5 15.2 3.5 9.2 C3.5 6.3 5.8 4.2 8.4 4.2 C10.1 4.2 11.4 5.1 12 6.2 C12.6 5.1 13.9 4.2 15.6 4.2 C18.2 4.2 20.5 6.3 20.5 9.2 C20.5 15.2 12 20.5 12 20.5 Z" {...stroke} />
      )}
      {name === 'heartFill' && (
        <Path d="M12 20.8C12 20.8 3 15.2 3 8.9 C3 5.8 5.4 3.5 8.3 3.5 C10.1 3.5 11.4 4.5 12 5.7 C12.6 4.5 13.9 3.5 15.7 3.5 C18.6 3.5 21 5.8 21 8.9 C21 15.2 12 20.8 12 20.8 Z" {...solid} />
      )}
      {name === 'chat' && (
        <Path d="M4 5.5 H20 A1.5 1.5 0 0 1 21.5 7 V15 A1.5 1.5 0 0 1 20 16.5 H10 L6 20 V16.5 H4 A1.5 1.5 0 0 1 2.5 15 V7 A1.5 1.5 0 0 1 4 5.5 Z" {...stroke} />
      )}
      {name === 'mail' && (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={2.5} {...stroke} />
          <Path d="M3.6 7 L12 13 L20.4 7" {...stroke} />
        </>
      )}
      {name === 'more' && (
        <>
          <Circle cx={12} cy={5} r={1.8} {...solid} />
          <Circle cx={12} cy={12} r={1.8} {...solid} />
          <Circle cx={12} cy={19} r={1.8} {...solid} />
        </>
      )}
      {name === 'key' && (
        <>
          <Circle cx={8} cy={8} r={4.5} {...stroke} />
          <Path d="M11.2 11.2 L20 20 M17 17 L19.5 14.5 M14.5 14.5 L17 12" {...stroke} />
        </>
      )}
      {name === 'book' && (
        <>
          <Path d="M4 4.5 H10 A2.5 2.5 0 0 1 12 6 A2.5 2.5 0 0 1 14 4.5 H20 V18 H13.5 A1.5 1.5 0 0 0 12 19.5 A1.5 1.5 0 0 0 10.5 18 H4 Z" {...stroke} />
          <Line x1={12} y1={6} x2={12} y2={19.5} {...stroke} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4.5 20 C4.5 16 7.5 14 12 14 C16.5 14 19.5 16 19.5 20" {...stroke} />
        </>
      )}
      {name === 'spark' && (
        <Path d="M12 2.5 C12.6 7.2 14.8 9.4 19.5 10 C14.8 10.6 12.6 12.8 12 17.5 C11.4 12.8 9.2 10.6 4.5 10 C9.2 9.4 11.4 7.2 12 2.5 Z" {...solid} />
      )}
      {name === 'gear' && (
        <>
          <Circle cx={12} cy={12} r={3} {...stroke} />
          <Path d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.2 5.2 L7 7 M17 17 L18.8 18.8 M18.8 5.2 L17 7 M7 17 L5.2 18.8" {...stroke} />
        </>
      )}
      {name === 'chevronRight' && <Polyline points="9,5 16,12 9,19" {...stroke} />}
      {name === 'chevronLeft' && <Polyline points="15,5 8,12 15,19" {...stroke} />}
      {name === 'arrowRight' && (
        <>
          <Line x1={4} y1={12} x2={20} y2={12} {...stroke} />
          <Polyline points="13,5 20,12 13,19" {...stroke} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M3 8 H7 L8.5 5.5 H15.5 L17 8 H21 V18 H3 Z" {...stroke} />
          <Circle cx={12} cy={13} r={3.5} {...stroke} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} {...stroke} />
          <Path d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5" {...stroke} />
        </>
      )}
      {name === 'check' && <Polyline points="4,12.5 9.5,18 20,6.5" {...stroke} />}
      {name === 'close' && (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...stroke} />
          <Line x1={18} y1={6} x2={6} y2={18} {...stroke} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...stroke} />
          <Line x1={5} y1={12} x2={19} y2={12} {...stroke} />
        </>
      )}
      {name === 'edit' && (
        <Path d="M5 19 H8 L18 9 L15 6 L5 16 Z M14 7 L17 10" {...stroke} />
      )}
      {name === 'filter' && (
        <Path d="M4 6 H20 M7 12 H17 M10 18 H14" {...stroke} />
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={6.5} {...stroke} />
          <Line x1={16} y1={16} x2={20} y2={20} {...stroke} />
        </>
      )}
      {name === 'send' && (
        <Path d="M3.5 12 L20.5 4 L15 20 L11.5 13 Z M11.5 13 L20.5 4" {...stroke} />
      )}
      {name === 'crown' && (
        <Path d="M4 18 L5.5 8 L9.5 12 L12 6 L14.5 12 L18.5 8 L20 18 Z" {...solid} />
      )}
      {name === 'bell' && (
        <Path d="M6 17 V11 A6 6 0 0 1 18 11 V17 L20 19 H4 Z M10 19 A2 2 0 0 0 14 19" {...stroke} />
      )}
      {name === 'logout' && (
        <>
          <Path d="M14 4 H6 A1.5 1.5 0 0 0 4.5 5.5 V18.5 A1.5 1.5 0 0 0 6 20 H14" {...stroke} />
          <Path d="M17 8 L21 12 L17 16 M21 12 H10" {...stroke} />
        </>
      )}
      {name === 'bolt' && (
        <Path d="M13 2.5 L5 13 H11 L10 21.5 L19 10.5 H13 Z" {...solid} />
      )}
      {name === 'ban' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...stroke} />
          <Line x1={6} y1={6} x2={18} y2={18} {...stroke} />
        </>
      )}
      {name === 'inbox' && (
        <>
          <Path d="M4 4.5 H20 A1.5 1.5 0 0 1 21.5 6 V18 A1.5 1.5 0 0 1 20 19.5 H4 A1.5 1.5 0 0 1 2.5 18 V6 A1.5 1.5 0 0 1 4 4.5 Z" {...stroke} />
          <Path d="M2.5 13.5 H8 A1 1 0 0 1 9 14.5 A3 3 0 0 0 15 14.5 A1 1 0 0 1 16 13.5 H21.5" {...stroke} />
        </>
      )}
      {name === 'graduation' && (
        <>
          <Path d="M2.5 8.5 L12 4.5 L21.5 8.5 L12 12.5 Z" {...stroke} />
          <Path d="M6 10.5 V15 C6 16.5 9 17.5 12 17.5 C15 17.5 18 16.5 18 15 V10.5" {...stroke} />
        </>
      )}
      {name === 'handshake' && (
        <Path d="M3 9 L7 6 L12 8 L17 6 L21 9 V14 L17 17 L13 14 L11 16 L8 14 L7 15 L3 12 Z" {...stroke} />
      )}
      {name === 'sparkles' && (
        <>
          <Path d="M12 3 C12.5 6.5 13.5 7.5 17 8 C13.5 8.5 12.5 9.5 12 13 C11.5 9.5 10.5 8.5 7 8 C10.5 7.5 11.5 6.5 12 3 Z" {...solid} />
          <Path d="M18 13 C18.3 15 18.8 15.5 20.8 15.8 C18.8 16.1 18.3 16.6 18 18.6 C17.7 16.6 17.2 16.1 15.2 15.8 C17.2 15.5 17.7 15 18 13 Z" {...solid} />
        </>
      )}
      {name === 'ruler' && (
        <>
          <Rect x={3} y={8.5} width={18} height={7} rx={1.5} {...stroke} />
          <Path d="M7 8.5 V12 M11 8.5 V12 M15 8.5 V12 M19 8.5 V12" {...stroke} />
        </>
      )}
    </Svg>
  );
}
