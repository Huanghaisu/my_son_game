// ============================================================
// 怪兽击倒庆祝弹窗（使用 RN 内置 Animated，非 Reanimated）
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
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(180)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const starSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      starSpin.setValue(0);
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, damping: 11, stiffness: 140, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 13, stiffness: 120, useNativeDriver: true }),
        Animated.loop(
          Animated.timing(starSpin, { toValue: 1, duration: 4000, useNativeDriver: true })
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 180, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!monster) return null;

  const bonusPoints = Math.floor(monster.maxHP * 0.1);
  const spinInterpolate = starSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
          {/* Spinning stars decoration */}
          <Animated.Text style={[styles.spinStars, { transform: [{ rotate: spinInterpolate }] }]}>
            ✨
          </Animated.Text>

          <Text style={styles.defeatBanner}>🎉 怪兽被击倒了！</Text>

          {/* Monster icon with X overlay */}
          <View style={styles.monsterIconWrapper}>
            <Text style={styles.monsterIcon}>{monster.icon}</Text>
            <View style={styles.defeatedX}>
              <Text style={styles.defeatedXText}>✕</Text>
            </View>
          </View>

          <Text style={styles.monsterName}>{monster.name}</Text>

          {/* Reward */}
          <View style={styles.rewardBox}>
            <Text style={styles.rewardTitle}>🏆 闯关奖励</Text>
            <Text style={styles.rewardText}>
              {monster.rewardIcon ?? '🎁'} {monster.reward}
            </Text>
          </View>

          {/* Bonus points */}
          <View style={styles.bonusBox}>
            <Text style={styles.bonusText}>⭐ 额外奖励 +{bonusPoints} 积分！</Text>
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>继续冒险！⚔️</Text>
          </TouchableOpacity>
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
  spinStars: {
    position: 'absolute',
    top: 14,
    right: 22,
    fontSize: 24,
  },
  defeatBanner: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
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
  continueBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
