// Step 7/7 — Onboarding 完成庆祝页

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

export default function SetupCompleteScreen() {
  const { settings, tasks, monsters, updateSettings, switchToChild } = useAppStore();

  // 入场动画
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const currentMonster = monsters[0];
  const taskCount = tasks.length;

  const handleStart = () => {
    updateSettings({ isOnboardingComplete: true });
    // isOnboardingComplete = true 会触发 AppNavigator 切换到 ChildNavigator
  };

  return (
    <View style={styles.container}>
      {/* 背景装饰 */}
      <Text style={styles.bg1}>🌟</Text>
      <Text style={styles.bg2}>✨</Text>
      <Text style={styles.bg3}>🎉</Text>
      <Text style={styles.bg4}>⭐</Text>

      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
        <Text style={styles.emoji}>🎊</Text>
        <Text style={styles.title}>准备好了！</Text>
        <Text style={styles.subtitle}>
          {settings.childName} 的冒险即将开始
        </Text>

        {/* 配置摘要 */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>👶</Text>
            <Text style={styles.summaryText}>勇者：{settings.childName}  {settings.childAvatar}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryText}>今日任务：{taskCount} 个</Text>
          </View>
          {currentMonster && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryIcon}>👾</Text>
              <Text style={styles.summaryText}>
                第一关：{currentMonster.icon} {currentMonster.name}（HP {currentMonster.maxHP}）
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>⚙️</Text>
            <Text style={styles.summaryText}>
              确认方式：{settings.taskConfirmMode === 'auto' ? '⚡ 自动确认' : '👨‍👩‍👧 家长确认'}
            </Text>
          </View>
        </View>

        <Text style={styles.tip}>💡 家长可随时长按首页Logo进入管理界面</Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>⚔️  出发！开始冒险！</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', alignItems: 'center', justifyContent: 'center', padding: 24 },
  bg1: { position: 'absolute', top: 60, left: 30, fontSize: 40, opacity: 0.3 },
  bg2: { position: 'absolute', top: 120, right: 20, fontSize: 28, opacity: 0.25 },
  bg3: { position: 'absolute', bottom: 140, left: 20, fontSize: 32, opacity: 0.25 },
  bg4: { position: 'absolute', bottom: 200, right: 40, fontSize: 24, opacity: 0.2 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 28, width: '100%',
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#FF8C00', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    borderWidth: 2, borderColor: '#FFD580',
  },
  emoji: { fontSize: 72, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF8C00', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  summary: { width: '100%', gap: 12, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { fontSize: 20, width: 28 },
  summaryText: { fontSize: 15, color: '#444', flex: 1 },
  tip: { fontSize: 12, color: '#bbb', textAlign: 'center' },
  startBtn: {
    backgroundColor: '#FF8C00', borderRadius: 32, paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF8C00', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { fontSize: 22, color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
});
