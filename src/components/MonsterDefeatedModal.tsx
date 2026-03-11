// ============================================================
// 怪兽击倒庆祝弹窗（RN 内置 Animated，禁用 Reanimated）
// UI 优化：多旋转星星 + 按钮脉冲 + 积分弹跳动画
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Monster } from '../store/types';
import { hapticHeavy } from '../utils/haptics';

interface MonsterDefeatedModalProps {
  visible: boolean;
  monster: Monster | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function MonsterDefeatedModal({
  visible,
  monster,
  onClose,
}: MonsterDefeatedModalProps) {
  const scale      = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(180)).current;
  const bgOpacity  = useRef(new Animated.Value(0)).current;

  // 三个独立旋转星星
  const starSpin1  = useRef(new Animated.Value(0)).current;
  const starSpin2  = useRef(new Animated.Value(0)).current;
  const starSpin3  = useRef(new Animated.Value(0)).current;

  // 按钮脉冲
  const btnPulse   = useRef(new Animated.Value(1)).current;

  // 积分徽章弹出
  const bonusScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      hapticHeavy();
      // 重置所有值
      starSpin1.setValue(0);
      starSpin2.setValue(0);
      starSpin3.setValue(0);
      bonusScale.setValue(0);
      btnPulse.setValue(1);

      Animated.parallel([
        // 遮罩渐入
        Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        // 弹窗弹出
        Animated.spring(scale,      { toValue: 1, damping: 11, stiffness: 140, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 13, stiffness: 120, useNativeDriver: true }),
        // 三颗星循环旋转（不同方向/速度）
        Animated.loop(
          Animated.timing(starSpin1, { toValue: 1,  duration: 3500, useNativeDriver: true })
        ),
        Animated.loop(
          Animated.timing(starSpin2, { toValue: 1,  duration: 2800, useNativeDriver: true })
        ),
        Animated.loop(
          Animated.timing(starSpin3, { toValue: -1, duration: 4500, useNativeDriver: true })
        ),
      ]).start();

      // 积分徽章延迟弹出
      setTimeout(() => {
        Animated.spring(bonusScale, { toValue: 1, damping: 9, stiffness: 160, useNativeDriver: true }).start();
      }, 350);

      // 按钮脉冲（延迟后开始）
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(btnPulse, { toValue: 1.06, duration: 650, useNativeDriver: true }),
            Animated.timing(btnPulse, { toValue: 1,    duration: 650, useNativeDriver: true }),
          ])
        ).start();
      }, 500);

    } else {
      Animated.parallel([
        Animated.timing(bgOpacity,  { toValue: 0,   duration: 200, useNativeDriver: true }),
        Animated.timing(scale,      { toValue: 0.6, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 180, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!monster) return null;

  const bonusPoints = Math.floor(monster.maxHP * 0.1);

  const spin1 = starSpin1.interpolate({ inputRange: [0, 1],  outputRange: ['0deg', '360deg'] });
  const spin2 = starSpin2.interpolate({ inputRange: [0, 1],  outputRange: ['0deg', '360deg'] });
  const spin3 = starSpin3.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>

          {/* 左上旋转星（金色） */}
          <Animated.Text style={[styles.star, styles.starTL, { transform: [{ rotate: spin1 }] }]}>
            ⭐
          </Animated.Text>
          {/* 右上旋转星（闪光） */}
          <Animated.Text style={[styles.star, styles.starTR, { transform: [{ rotate: spin2 }] }]}>
            ✨
          </Animated.Text>
          {/* 右侧反向旋转星 */}
          <Animated.Text style={[styles.star, styles.starMR, { transform: [{ rotate: spin3 }] }]}>
            🌟
          </Animated.Text>

          {/* 标题 */}
          <Text style={styles.defeatBanner}>🎉 怪兽被击倒了！</Text>

          {/* 怪兽图标 + X标记 */}
          <View style={styles.monsterIconWrapper}>
            <Text style={styles.monsterIcon}>{monster.icon}</Text>
            <View style={styles.defeatedX}>
              <Text style={styles.defeatedXText}>✕</Text>
            </View>
          </View>

          <Text style={styles.monsterName}>{monster.name}</Text>

          {/* 闯关奖励 */}
          <View style={styles.rewardBox}>
            <Text style={styles.rewardTitle}>🏆 闯关奖励</Text>
            <Text style={styles.rewardText}>
              {monster.rewardIcon ?? '🎁'} {monster.reward}
            </Text>
          </View>

          {/* 额外积分（弹出动画） */}
          <Animated.View style={[styles.bonusBox, { transform: [{ scale: bonusScale }] }]}>
            <Text style={styles.bonusText}>⭐ 额外奖励 +{bonusPoints} 金币！</Text>
          </Animated.View>

          {/* 继续按钮（脉冲动画） */}
          <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityLabel="继续冒险"
              accessibilityRole="button"
            >
              <Text style={styles.continueBtnText}>继续冒险！⚔️</Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width * 0.82,
    backgroundColor: '#fff',
    borderRadius: 28,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 16,
  },

  // 旋转星星（绝对定位装饰）
  star: {
    position: 'absolute',
  },
  starTL: {
    top: 14,
    left: 20,
    fontSize: 22,
  },
  starTR: {
    top: 12,
    right: 20,
    fontSize: 26,
  },
  starMR: {
    top: 56,
    right: 14,
    fontSize: 18,
  },

  // 标题
  defeatBanner: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },

  // 怪兽图标
  monsterIconWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  monsterIcon: {
    fontSize: 72,
  },
  defeatedX: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defeatedXText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monsterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },

  // 奖励框
  rewardBox: {
    width: '100%',
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  rewardTitle: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#78350F',
    textAlign: 'center',
  },

  // 额外积分
  bonusBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  bonusText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
  },

  // 继续按钮
  continueBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
