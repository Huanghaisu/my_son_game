// ============================================================
// 金色硬币图标 — 替代 🪙 emoji（iOS 渲染银色，此组件始终金色）
// ============================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface GoldCoinProps {
  size?: number;
}

export default function GoldCoin({ size = 18 }: GoldCoinProps) {
  const innerSize = Math.round(size * 0.58);
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.inner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#FBBF24',
    borderWidth: 1.5,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  inner: {
    backgroundColor: '#FDE68A',
  },
});
