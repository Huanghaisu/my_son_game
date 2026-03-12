// ============================================================
// 儿童端 — 任务大厅（阶段 4 完整实现）
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Task } from '../../store/types';
import CardRewardModal from '../../components/CardRewardModal';
import PINModal from '../../components/PINModal';
import StreakMilestoneModal from '../../components/StreakMilestoneModal';
import GoldCoin from '../../components/GoldCoin';
import { hapticSuccess, hapticLight } from '../../utils/haptics';

export default function TaskHallScreen() {
  const {
    tasks,
    monsters,
    points,
    settings,
    completeTask,
    switchToParent,
    verifyPIN,
    pendingMilestoneReward,
    clearPendingMilestoneReward,
  } = useAppStore();

  const [rewardTask, setRewardTask] = useState<Task | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);

  const enabledTasks = tasks.filter((t) => t.isEnabled);
  const activeMonsters = monsters.filter((m) => !m.isDefeated);
  const currentMonster = activeMonsters[0] ?? null;

  const completedToday = enabledTasks.filter((t) => t.status === 'completed').length;

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    hapticSuccess();
    completeTask(taskId);

    if (settings.taskConfirmMode === 'auto') {
      setRewardTask(task);
      setShowRewardModal(true);
    }
    // parent_confirm 模式：任务状态变为 waiting_confirm，UI 自动更新
  };

  const hpPercent = currentMonster
    ? Math.max(0, currentMonster.currentHP / currentMonster.maxHP)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8C00" />

      {/* ── 顶部 Header ───────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.avatar}>{settings.childAvatar}</Text>
          <View>
            <Text style={styles.childName}>{settings.childName || '小勇者'}</Text>
            <Text style={styles.progressText}>
              今日完成 {completedToday}/{enabledTasks.length}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.pointsBadge}>
            <GoldCoin size={18} />
            <Text style={styles.pointsText}> {points}</Text>
          </View>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => { hapticLight(); setShowPINModal(true); }}
            accessibilityLabel="家长设置"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 当前怪兽预览 ───────────────────────────── */}
        {currentMonster ? (
          <View style={styles.monsterSection}>
            <View style={styles.monsterCard}>
              <Text style={styles.monsterEmoji}>{currentMonster.icon}</Text>
              <View style={styles.monsterInfo}>
                <Text style={styles.monsterName}>{currentMonster.name}</Text>
                <View style={styles.hpBarBg}>
                  <View
                    style={[
                      styles.hpBarFill,
                      {
                        width: `${hpPercent * 100}%`,
                        backgroundColor: hpPercent > 0.5 ? '#ef4444' : hpPercent > 0.25 ? '#f97316' : '#dc2626',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.hpText}>
                  ❤️ {currentMonster.currentHP} / {currentMonster.maxHP}
                </Text>
              </View>
              <View style={styles.monsterReward}>
                <Text style={styles.monsterRewardIcon}>{currentMonster.rewardIcon ?? '🎁'}</Text>
                <Text style={styles.monsterRewardLabel}>奖励</Text>
              </View>
            </View>
            <Text style={styles.monsterHint}>⚔️ 完成任务获得卡牌，去战斗场攻击怪兽！</Text>
          </View>
        ) : (
          <View style={styles.noMonsterBanner}>
            <Text style={styles.noMonsterText}>🏆 所有怪兽都被打败了！太厉害了！</Text>
          </View>
        )}

        {/* ── 任务列表 ───────────────────────────────── */}
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>📋 今日任务</Text>

          {enabledTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>还没有任务</Text>
              <Text style={styles.emptyHint}>请让爸爸妈妈来添加任务吧！</Text>
            </View>
          ) : (
            enabledTasks.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={handleCompleteTask} />
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── 弹窗 ───────────────────────────────────── */}
      <CardRewardModal
        visible={showRewardModal}
        task={rewardTask}
        onClose={() => {
          setShowRewardModal(false);
          setRewardTask(null);
        }}
      />

      <PINModal
        visible={showPINModal}
        onSuccess={() => {
          setShowPINModal(false);
          switchToParent();
        }}
        onCancel={() => setShowPINModal(false)}
        verifyPIN={verifyPIN}
      />

      <StreakMilestoneModal
        achievement={pendingMilestoneReward}
        onClose={clearPendingMilestoneReward}
      />
    </SafeAreaView>
  );
}

// ── 任务卡片组件 ──────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

function TaskItem({ task, onComplete }: TaskItemProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const handlePressIn  = () => Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () => Animated.spring(pressScale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  const isHard = task.type === 'hard';
  const accentColor = isHard ? '#7C3AED' : '#16a34a';

  const borderColor =
    task.status === 'completed'
      ? '#d1d5db'
      : task.status === 'waiting_confirm'
      ? '#f97316'
      : accentColor;

  return (
    <View style={[styles.taskCard, { borderLeftColor: borderColor }]}>
      {/* 任务基本信息 */}
      <View style={styles.taskTop}>
        <Text style={styles.taskEmoji}>{task.icon}</Text>
        <View style={styles.taskMeta}>
          <View style={styles.taskNameRow}>
            <Text style={styles.taskName} numberOfLines={1}>
              {task.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.typeBadgeText}>{isHard ? '困难' : '普通'}</Text>
            </View>
          </View>
          <View style={styles.taskStats}>
            {task.timeRequirement ? (
              <Text style={styles.statText}>⏰ {task.timeRequirement}</Text>
            ) : null}
            <Text style={styles.statText}>⚔️ {task.attackPower}</Text>
            <View style={styles.coinStat}>
              <GoldCoin size={13} />
              <Text style={[styles.statText, { color: '#FF8C00', fontWeight: '700' }]}>
                {` +${task.points}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 状态区域 */}
      {task.status === 'pending' && (
        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: accentColor }]}
          onPress={() => onComplete(task.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessibilityLabel={`标记任务完成：${task.name}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <Text style={styles.completeBtnText}>✅  我完成了！</Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {task.status === 'waiting_confirm' && (
        <View style={styles.waitingBadge}>
          <Text style={styles.waitingText}>⏳  等待爸爸妈妈确认...</Text>
        </View>
      )}

      {task.status === 'completed' && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>🎉  今日已完成！</Text>
        </View>
      )}

      {/* 连续打卡 streak 显示 */}
      {task.streakEnabled && (
        <View style={styles.streakRow}>
          <Text style={styles.streakCountText}>
            🔥 {task.streakCount > 0 ? `已连续 ${task.streakCount} 天！` : '连续打卡中'}
          </Text>
          <View style={styles.milestonePips}>
            {task.streakMilestones.map(m => {
              const mColor = m.days === 3 ? '#EA580C' : m.days === 7 ? '#7C3AED' : '#D97706';
              return (
                <View 
                  key={m.days} 
                  style={[
                    styles.milestonePip, 
                    m.achieved && { backgroundColor: mColor, borderColor: mColor }
                  ]}
                >
                  <Text style={[styles.milestonePipText, m.achieved ? { color: '#fff' } : { color: mColor }]}>
                    {m.achieved ? '✓ ' : ''}{m.days}天
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ── 样式 ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF8C00',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    fontSize: 42,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gearBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 26,
  },

  // Scroll
  scroll: {
    flex: 1,
  },

  // Monster section
  monsterSection: {
    margin: 16,
    marginBottom: 4,
  },
  monsterCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  monsterEmoji: {
    fontSize: 52,
  },
  monsterInfo: {
    flex: 1,
  },
  monsterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  hpBarBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  hpText: {
    fontSize: 12,
    color: '#666',
  },
  monsterReward: {
    alignItems: 'center',
    gap: 2,
  },
  monsterRewardIcon: {
    fontSize: 34,
  },
  monsterRewardLabel: {
    fontSize: 11,
    color: '#888',
  },
  monsterHint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  noMonsterBanner: {
    margin: 16,
    marginBottom: 4,
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    alignItems: 'center',
  },
  noMonsterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    textAlign: 'center',
  },

  // Task section
  taskSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 14,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
  },
  emptyHint: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },

  // Task card
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  taskEmoji: {
    fontSize: 42,
  },
  taskMeta: {
    flex: 1,
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  coinStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },

  // Buttons & status badges
  completeBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  waitingBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  waitingText: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedText: {
    color: '#15803D',
    fontSize: 16,
    fontWeight: '600',
  },

  // Streak display
  streakRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakCountText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '700',
  },
  milestonePips: {
    flexDirection: 'row',
    gap: 5,
  },
  milestonePip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  milestonePipDone: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  milestonePipText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
});
