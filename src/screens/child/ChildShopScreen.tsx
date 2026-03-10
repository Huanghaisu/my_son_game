// ============================================================
// 儿童端 — 积分商城（阶段 6 占位）
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function ChildShopScreen() {
  const { points } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8C00" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 积分商城</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>⭐ {points}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.icon}>🎁</Text>
        <Text style={styles.title}>商城即将开放</Text>
        <Text style={styles.hint}>
          继续完成任务，积累积分，{'\n'}很快就能兑换心仪的奖励！
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFBF0',
  },
  header: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  hint: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});
