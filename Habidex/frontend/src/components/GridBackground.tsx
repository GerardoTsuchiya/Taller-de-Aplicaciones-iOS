import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const GRID = 18;

export default function GridBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <Line x1={0} y1={0} x2={GRID} y2={0} stroke="rgba(255,255,255,0.018)" strokeWidth={1} />
            <Line x1={0} y1={0} x2={0} y2={GRID} stroke="rgba(255,255,255,0.018)" strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
      </Svg>
    </View>
  );
}
