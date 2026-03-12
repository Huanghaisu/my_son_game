// ============================================================
// 怪兽选择界面（儿童端）
// 孩子在此选择挑战哪只怪兽，选完直接进入战斗
// ============================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Monster } from '../../store/types';
import { getMonsterImage } from '../../constants/monsterThemes';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  navigation: any;
}

export default function MonsterSelectScreen({ navigation }: Props) {
  const monsters = useAppStore((s) => s.monsters);
  const activeMonsters = monsters.filter((m) => !m.isDefeated);
  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelect = (monster: Monster) => {
    navigation.navigate('Battle', { monsterId: monster.id });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 背景 */}
      <View style={styles.bg} />

      {/* 顶部标题 */}
      <Animated.View
        style={[
          styles.header,
          { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <Text style={styles.headerTitle}>选择挑战目标</Text>
        <Text style={styles.headerSub}>勇者，你要挑战哪只怪兽？</Text>
      </Animated.View>

      {/* 怪兽列表 */}
      {activeMonsters.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>所有怪兽已被击倒！</Text>
          <Text style={styles.emptyDesc}>请让爸爸妈妈添加新的怪兽</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {activeMonsters.map((monster, index) => (
            <MonsterCard
              key={monster.id}
              monster={monster}
              index={index}
              onPress={() => handleSelect(monster)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---- 怪兽卡片 ----------------------------------------------

interface CardProps {
  monster: Monster;
  index: number;
  onPress: () => void;
}

function MonsterCard({ monster, index, onPress }: CardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const monsterImage = getMonsterImage(monster.themeId, monster.imageKey);
  const hpPercent = monster.currentHP / monster.maxHP;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 70,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const difficultyColor = {
    easy: '#4CAF50',
    normal: '#FF9800',
    hard: '#F44336',
  }[monster.difficulty];

  const difficultyLabel = {
    easy: '简单',
    normal: '普通',
    hard: '困难',
  }[monster.difficulty];

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          transform: [{ scale: Animated.multiply(scaleAnim, pressAnim) }],
          opacity: scaleAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.card}>
          {/* 难度标签 */}
          <View style={[styles.diffBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.diffText}>{difficultyLabel}</Text>
          </View>

          {/* 怪兽形象 */}
          <View style={styles.monsterImgWrap}>
            {monsterImage ? (
              <Image source={monsterImage} style={styles.monsterImg} resizeMode="contain" />
            ) : (
              <Text style={styles.monsterEmoji}>{monster.icon}</Text>
            )}
          </View>

          {/* 名字 */}
          <Text style={styles.monsterName}>{monster.name}</Text>

          {/* HP 条 */}
          <View style={styles.hpWrap}>
            <View style={styles.hpBg}>
              <View style={[styles.hpFill, { width: `${hpPercent * 100}%` as any }]} />
            </View>
            <Text style={styles.hpText}>{monster.currentHP}/{monster.maxHP}</Text>
          </View>

          {/* 奖励 */}
          <Text style={styles.rewardText}>
            {monster.rewardIcon ?? '🎁'} {monster.reward}
          </Text>

          {/* 挑战按钮 */}
          <View style={styles.challengeBtn}>
            <Text style={styles.challengeText}>去挑战 ⚔️</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---- 样式 --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0c29',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 40,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  diffBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  monsterImgWrap: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  monsterImg: {
    width: 100,
    height: 100,
  },
  monsterEmoji: {
    fontSize: 64,
  },
  monsterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  hpWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  hpBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  hpText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  rewardText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 10,
  },
  challengeBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  challengeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700',
  },
  emptyDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
