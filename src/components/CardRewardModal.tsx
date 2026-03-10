// ============================================================
// 卡牌奖励弹窗 — 任务完成后的卡牌获得动画（使用 RN 内置 Animated）
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
import { Card } from '../store/types';

interface CardRewardModalProps {
  visible: boolean;
  card: Card | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function CardRewardModal({ visible, card, onClose }: CardRewardModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(200)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 14,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.6,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 200,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!card) return null;

  const isSkill = card.type === 'skill';
  const cardColor = isSkill ? '#7C3AED' : '#2563EB';
  const cardBgColor = isSkill ? '#EDE9FE' : '#DBEAFE';
  const typeLabel = isSkill ? '⚡ 技能绝招卡' : '🗡️ 普通工具卡';

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        <Animated.View
          style={[
            styles.wrapper,
            { transform: [{ scale }, { translateY }] },
          ]}
        >
          <Text style={styles.stars}>✨  ✨  ✨</Text>

          {/* 卡牌主体 */}
          <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardColor }]}>
            <View style={[styles.cardHeader, { backgroundColor: cardColor }]}>
              <Text style={styles.cardTypeLabel}>{typeLabel}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={[styles.cardTaskName, { color: cardColor }]} numberOfLines={1}>
                {card.taskName}
              </Text>
              <View style={[styles.attackBadge, { backgroundColor: cardColor }]}>
                <Text style={styles.attackText}>⚔️  攻击力 +{card.attackPower}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.rewardText}>🎉 获得了新卡牌！</Text>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: cardColor }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>太棒了！收下了！</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    width: width * 0.8,
  },
  stars: {
    fontSize: 26,
    marginBottom: 14,
    letterSpacing: 4,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  cardHeader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardTypeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardBody: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  cardIcon: {
    fontSize: 76,
    marginBottom: 12,
  },
  cardTaskName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  attackBadge: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 22,
  },
  attackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 22,
    marginBottom: 14,
  },
  closeBtn: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
