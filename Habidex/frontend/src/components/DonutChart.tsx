import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';

interface Props {
  pct: number;
  size?: number;
}

export default function DonutChart({ pct, size = 90 }: Props) {
  const R = size * 0.37;
  const cx = size / 2;
  const strokeW = size * 0.12;
  const circumference = 2 * Math.PI * R;
  const filled = (pct / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={R} fill="none" stroke="#181828" strokeWidth={strokeW} />
      <Circle
        cx={cx} cy={cx} r={R} fill="none"
        stroke={Colors.green} strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="square"
        rotation="-90" originX={cx} originY={cx}
      />
      <SvgText x={cx} y={cx - 4} textAnchor="middle" fontFamily={Fonts.pixel} fontSize={size * 0.12} fill="#ffffff">
        {pct}%
      </SvgText>
      <SvgText x={cx} y={cx + 12} textAnchor="middle" fontFamily={Fonts.pixel} fontSize={size * 0.05} fill="#555555">
        30 DÍAS
      </SvgText>
    </Svg>
  );
}
