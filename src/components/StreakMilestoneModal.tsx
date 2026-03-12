// ============================================================
// 连续打卡里程碑达成庆祝弹窗
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Animated,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { MilestoneAchievement } from '../store/types';
import { hapticSuccess } from '../utils/haptics';
import { playSound } from '../utils/soundManager';

const { width: SW } = Dimensions.get('window');

interface Props {
  achievement: MilestoneAchievement | null;
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<number, { icon: string; label: string; accent: string; bg: string }> = {
  3:  { icon: '🔥', label: '连续 3 天达成！',  accent: '#EA580C', bg: '#FFF7ED' },
  7:  { icon: '⭐', label: '连续 7 天达成！',  accent: '#7C3AED', bg: '#F5F3FF' },
  15: { icon: '👑', label: '连续 15 天达成！', accent: '#D97706', bg: '#FFFBEB' },
};

export default function StreakMilestoneModal({ achievement, onClose }: Props) {
  const cardScale   = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconBounce  = useRef(new Animated.Value(0)).current;
  const star1       = useRef(new Animated.Value(0)).current;
  const star2       = useRef(new Animated.Value(0)).current;
  const star3       = useRef(new Animated.Value(0)).current;
  const star1Y      = useRef(new Animated.Value(0)).current;
  const star2Y      = useRef(new Animated.Value(0)).current;
  const star3Y      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;
    hapticSuccess();
    playSound('card_reward');

    // 卡片弹入
    cardScale.setValue(0.3);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(cardScale,   { toValue: 1, tension: 55, friction: 5, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    // 主图标弹跳
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(iconBounce, { toValue: 1, tension: 70, friction: 4, useNativeDriver: true }),
    ]).start();

    // 三颗星浮上去
    [
      [star1, star1Y],
      [star2, star2Y],
      [star3, star3Y],
    ].forEach(([op, y], i) => {
      (op as Animated.Value).setValue(0);
      (y  as Animated.Value).setValue(0);
      Animated.sequence([
        Animated.delay(400 + i * 150),
        Animated.parallel([
          Animated.timing(op as Animated.Value, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(y  as Animated.Value, { toValue: -60, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.timing(op as Animated.Value, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [achievement]);

  if (!achievement) return null;

  const cfg = MILESTONE_CONFIG[achievement.days] ?? MILESTONE_CONFIG[3];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cfg.bg, transform: [{ scale: cardScale }], opacity: cardOpacity },
          ]}
        >
          {/* 顶部色带 */}
          <View style={[styles.topBand, { backgroundColor: cfg.accent }]}>
            <Text style={styles.topLabel}>🎉 里程碑达成！</Text>
          </View>

          {/* 主图标 */}
          <Animated.Text
            style={[styles.mainIcon, { transform: [{ scale: iconBounce }] }]}
          >
            {cfg.icon}
          </Animated.Text>

          {/* 飘星 */}
          <View style={styles.starsLayer} pointerEvents="none">
            {[
              { op: star1, y: star1Y, left: SW * 0.22 },
              { op: star2, y: star2Y, left: SW * 0.42 },
              { op: star3, y: star3Y, left: SW * 0.60 },
            ].map((s, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.floatStar,
                  { left: s.left, opacity: s.op, transform: [{ translateY: s.y }] },
                ]}
              >
                ✨
              </Animated.Text>
            ))}
          </View>

          {/* 天数标签 */}
          <View style={[styles.daysBadge, { backgroundColor: cfg.accent }]}>
            <Text style={styles.daysText}>{cfg.label}</Text>
          </View>

          {/* 任务名 */}
          <Text style={styles.taskRow}>
            {achievement.taskIcon}  {achievement.taskName}
          </Text>

          {/* 奖励说明 */}
          <View style={[styles.rewardBox, { borderColor: cfg.accent }]}>
            <Text style={styles.rewardTitle}>🎁 奖励</Text>
            <Text style={styles.rewardDesc}>{achievement.rewardDescription}</Text>
            <Text style={styles.rewardHint}>快去找爸爸妈妈兑换吧！</Text>
          </View>

          {/* 按钮 */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: cfg.accent }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>太棒了！⚡</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  topBand: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  mainIcon: {
    fontSize: 80,
    marginTop: 24,
    marginBottom: 4,
  },
  starsLayer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 80,
  },
  floatStar: {
    position: 'absolute',
    fontSize: 22,
  },
  daysBadge: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  daysText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  taskRow: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  rewardBox: {
    width: '85%',
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginBottom: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  rewardDesc: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
  rewardHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: 48,
    paddingVertical: 15,
    borderRadius: 18,
  },
  btnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
