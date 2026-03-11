// ============================================================
// 待确认任务列表（parent_confirm 模式下使用）
// ============================================================

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { Task } from '../../store/types';

const BLUE = '#4A6FA5';
const BG = '#F0F4FF';

export default function PendingTasksScreen() {
  const { tasks, settings, confirmTask, rejectTask } = useAppStore();

  const pendingTasks = tasks.filter(t => t.status === 'waiting_confirm');

  const handleConfirm = (task: Task) => {
    Alert.alert(
      '确认完成',
      `确认 ${settings.childName} 已完成「${task.name}」吗？\n将发放卡牌 +${task.attackPower}攻击 ⭐+${task.points}积分`,
      [
        { text: '取消', style: 'cancel' },
        { text: '✅ 确认', onPress: () => confirmTask(task.id) },
      ]
    );
  };

  const handleReject = (task: Task) => {
    Alert.alert(
      '拒绝任务',
      `拒绝后「${task.name}」恢复为未完成状态，孩子需要重新完成。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '拒绝', onPress: () => rejectTask(task.id), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>待确认任务</Text>
        {pendingTasks.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{pendingTasks.length}</Text>
          </View>
        )}
      </View>

      {settings.taskConfirmMode === 'auto' ? (
        <View style={styles.centeredMsg}>
          <Text style={styles.modeIcon}>🤖</Text>
          <Text style={styles.modeTitle}>当前为「自动确认」模式</Text>
          <Text style={styles.modeDesc}>
            孩子完成任务后卡牌自动发放，{'\n'}无需家长手动确认。{'\n\n'}
            可在「设置」中切换为「家长确认」模式。
          </Text>
        </View>
      ) : pendingTasks.length === 0 ? (
        <View style={styles.centeredMsg}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>暂无待确认任务</Text>
          <Text style={styles.emptyDesc}>{settings.childName} 表现很棒！</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {pendingTasks.map(task => (
            <View key={task.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.taskIcon}>{task.icon}</Text>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  {task.timeRequirement && (
                    <Text style={styles.taskTime}>⏰ {task.timeRequirement}</Text>
                  )}
                  <View style={styles.statsRow}>
                    <View style={[styles.typeBadge, { backgroundColor: task.type === 'hard' ? '#FFF3E0' : '#E8F0FE' }]}>
                      <Text style={[styles.typeBadgeText, { color: task.type === 'hard' ? '#FF8C00' : BLUE }]}>
                        {task.type === 'hard' ? '⭐ 困难' : '📝 普通'}
                      </Text>
                    </View>
                    <Text style={styles.stat}>⚔️ {task.attackPower}</Text>
                    <Text style={styles.stat}>⭐ {task.points}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(task)}
                >
                  <Text style={styles.rejectBtnText}>✕ 拒绝</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirm(task)}
                >
                  <Text style={styles.confirmBtnText}>✓ 确认完成</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: '#FF8C00', borderRadius: 12, paddingHorizontal: 8,
    paddingVertical: 2, marginLeft: 10,
  },
  countBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  centeredMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#888', textAlign: 'center' },
  modeIcon: { fontSize: 60, marginBottom: 16 },
  modeTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  modeDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  list: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: 'row', marginBottom: 14 },
  taskIcon: { fontSize: 40, marginRight: 14, alignSelf: 'center' },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  taskTime: { fontSize: 12, color: '#888', marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  stat: { fontSize: 13, color: '#555', fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#FFB3B3', alignItems: 'center',
  },
  rejectBtnText: { color: '#F44336', fontSize: 15, fontWeight: '700' },
  confirmBtn: {
    flex: 2, paddingVertical: 11, borderRadius: 10,
    backgroundColor: '#4CAF50', alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
