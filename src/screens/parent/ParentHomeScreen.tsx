// ============================================================
// 家长端首页 — 仪表盘
// ============================================================

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

export default function ParentHomeScreen() {
  const {
    tasks, monsters, points,
    settings, switchToChild, resetDailyTasks,
  } = useAppStore();

  const enabledTasks = tasks.filter(t => t.isEnabled);
  const completedCount = enabledTasks.filter(t => t.status === 'completed').length;
  const pendingConfirmCount = tasks.filter(t => t.status === 'waiting_confirm').length;
  const totalCount = enabledTasks.length;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;

  const activeMonsters = monsters.filter(m => !m.isDefeated);
  const currentMonster = activeMonsters[0] ?? null;
  const hpPct = currentMonster ? currentMonster.currentHP / currentMonster.maxHP : 0;
  // 今日已点亮（可用于战斗）的卡牌数
  const litCardCount = enabledTasks.filter(t => t.status === 'completed' && !t.battleCardConsumed).length;

  const handleResetTasks = () => {
    Alert.alert('重置今日任务', '所有任务恢复为未完成状态，确定吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定重置', onPress: resetDailyTasks, style: 'destructive' },
    ]);
  };

  const handleSwitchToChild = () => {
    Alert.alert('切换到儿童模式', '确定切换吗？', [
      { text: '取消', style: 'cancel' },
      { text: '切换', onPress: switchToChild },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>家长中心 👨‍👩‍👧</Text>
            <Text style={styles.headerSub}>
              {settings.childAvatar} {settings.childName} 的成长管理
            </Text>
          </View>
          <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchToChild}>
            <Text style={styles.switchBtnText}>儿童模式</Text>
          </TouchableOpacity>
        </View>

        {/* 今日任务进度 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 今日任务进度</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.bigNum}>{completedCount} / {totalCount}</Text>
            {pendingConfirmCount > 0 && (
              <View style={styles.orangeBadge}>
                <Text style={styles.orangeBadgeText}>⏳ {pendingConfirmCount} 个待确认</Text>
              </View>
            )}
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>
            {totalCount === 0 ? '今日暂无任务' : `已完成 ${Math.round(progressPct * 100)}%`}
          </Text>
        </View>

        {/* 当前怪兽 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚔️ 当前挑战</Text>
          {currentMonster ? (
            <>
              <View style={styles.monsterRow}>
                <Text style={styles.monsterEmoji}>{currentMonster.icon}</Text>
                <View style={styles.monsterInfo}>
                  <Text style={styles.monsterName}>{currentMonster.name}</Text>
                  <Text style={styles.monsterHPLabel}>
                    HP {currentMonster.currentHP} / {currentMonster.maxHP}
                  </Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[currentMonster.difficulty] }]}>
                  <Text style={styles.diffBadgeText}>{DIFF_LABELS[currentMonster.difficulty]}</Text>
                </View>
              </View>
              <View style={styles.hpBg}>
                <View style={[styles.hpFill, { width: `${Math.round(hpPct * 100)}%` as any }]} />
              </View>
              <Text style={styles.rewardText}>
                {currentMonster.rewardIcon ?? '🎁'} 击倒奖励：{currentMonster.reward}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>暂无怪兽，去「管理」中添加吧</Text>
          )}
        </View>

        {/* 统计行 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNum}>{points}</Text>
            <Text style={styles.statLabel}>积分</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🃏</Text>
            <Text style={styles.statNum}>{litCardCount}</Text>
            <Text style={styles.statLabel}>可用卡牌</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>👾</Text>
            <Text style={styles.statNum}>{monsters.filter(m => m.isDefeated).length}</Text>
            <Text style={styles.statLabel}>已击倒</Text>
          </View>
        </View>

        {/* 重置任务 */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetTasks}>
          <Text style={styles.resetBtnText}>🔄 重置今日任务</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const DIFF_COLORS: Record<string, string> = {
  easy: '#4CAF50', normal: '#FF8C00', hard: '#F44336',
};
const DIFF_LABELS: Record<string, string> = {
  easy: '简单', normal: '普通', hard: '困难',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 3 },
  switchBtn: {
    backgroundColor: BLUE, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  switchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 14, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 10 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bigNum: { fontSize: 28, fontWeight: 'bold', color: BLUE },
  orangeBadge: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  orangeBadgeText: { color: '#FF8C00', fontSize: 13, fontWeight: '600' },

  progressBg: { height: 10, backgroundColor: '#E8F0FE', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: BLUE, borderRadius: 5 },
  progressLabel: { fontSize: 12, color: '#888' },

  monsterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  monsterEmoji: { fontSize: 44, marginRight: 14 },
  monsterInfo: { flex: 1 },
  monsterName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  monsterHPLabel: { fontSize: 13, color: '#888', marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hpBg: { height: 10, backgroundColor: '#FFEBEE', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  hpFill: { height: '100%', backgroundColor: '#F44336', borderRadius: 5 },
  rewardText: { fontSize: 13, color: '#888' },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', paddingVertical: 10 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  statEmoji: { fontSize: 26, marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: BLUE },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  resetBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { fontSize: 15, color: '#777', fontWeight: '600' },
});
