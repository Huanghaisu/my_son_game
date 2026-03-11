// ============================================================
// 儿童端 — 战斗场（阶段 5 完整实现）
// 动画：RN 内置 Animated + PanResponder（禁用 react-native-reanimated）
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { Card, Monster } from '../../store/types';
import MonsterDefeatedModal from '../../components/MonsterDefeatedModal';

const { height: SCREEN_H } = Dimensions.get('window');

// 卡牌视觉风格
const CARD_STYLE = {
  tool:  { bg: '#FFF7ED', border: '#F97316', header: '#EA580C' },
  skill: { bg: '#F5F3FF', border: '#8B5CF6', header: '#7C3AED' },
} as const;

export default function BattleScreen() {
  const navigation = useNavigation<any>();
  const { cards, monsters, currentMonsterIndex, attackCurrentMonster, loadNextMonster } =
    useAppStore();

  // ---- 派生数据 ------------------------------------------------
  const activeMonsters = monsters.filter((m) => !m.isDefeated);
  const currentMonster = activeMonsters[currentMonsterIndex] ?? activeMonsters[0] ?? null;
  const displayCards = cards.slice(0, 10);

  // ---- 局部状态 ------------------------------------------------
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [damageValue, setDamageValue] = useState(0);
  const [showDefeatedModal, setShowDefeatedModal] = useState(false);
  const [defeatedMonster, setDefeatedMonster] = useState<Monster | null>(null);
  const [counterVisible, setCounterVisible] = useState(false);

  // ---- Animated 值 --------------------------------------------
  const cardTX        = useRef(new Animated.Value(0)).current;
  const cardTY        = useRef(new Animated.Value(0)).current;
  const cardOpacity   = useRef(new Animated.Value(1)).current;
  const cardScale     = useRef(new Animated.Value(1)).current;

  const monsterTX     = useRef(new Animated.Value(0)).current;
  const monsterScale  = useRef(new Animated.Value(1)).current;

  const damageY       = useRef(new Animated.Value(0)).current;
  const damageOpacity = useRef(new Animated.Value(0)).current;

  // 两层闪光：黄色（攻击）/ 红色（反击）
  const attackFlash   = useRef(new Animated.Value(0)).current;
  const counterFlash  = useRef(new Animated.Value(0)).current;

  const hpBarAnim = useRef(
    new Animated.Value(
      currentMonster ? currentMonster.currentHP / currentMonster.maxHP : 1
    )
  ).current;

  // ---- 怪兽切换时同步 HP 条 -----------------------------------
  useEffect(() => {
    if (currentMonster) {
      hpBarAnim.setValue(currentMonster.currentHP / currentMonster.maxHP);
    }
  }, [currentMonster?.id]);

  // ---- 卡牌移除后修正索引 -------------------------------------
  useEffect(() => {
    if (displayCards.length > 0 && currentCardIdx >= displayCards.length) {
      setCurrentCardIdx(displayCards.length - 1);
    }
  }, [displayCards.length]);

  // ---- 辅助：重置卡牌动画 -------------------------------------
  const resetCardAnim = () => {
    cardTX.setValue(0);
    cardTY.setValue(0);
    cardOpacity.setValue(1);
    cardScale.setValue(1);
  };

  // ---- 怪兽抖动序列 -------------------------------------------
  const shakeMonster = (strong: boolean) =>
    Animated.sequence([
      Animated.timing(monsterTX, { toValue: strong ? -28 : -11, duration: 55, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ?  28 :  11, duration: 65, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? -22 :  -8, duration: 60, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ?  18 :   6, duration: 55, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: 0,                  duration: 55, useNativeDriver: true }),
    ]);

  // ---- 伤害数字飘出 -------------------------------------------
  const showDamageNumber = (isSkill: boolean) => {
    damageY.setValue(0);
    damageOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(damageY, {
        toValue: isSkill ? -115 : -75,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(isSkill ? 520 : 360),
        Animated.timing(damageOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // ---- 执行攻击 -----------------------------------------------
  const performAttack = (card: Card, monster: Monster) => {
    setIsAnimating(true);
    setDamageValue(card.attackPower);

    const newHP  = Math.max(0, monster.currentHP - card.attackPower);
    const newPct = newHP / monster.maxHP;
    const isSkill = card.type === 'skill';

    // 卡牌飞出后的统一回调：提交 store + 播放命中动效
    const afterFlyOut = () => {
      // 提交伤害（store 内自动移除卡牌，HP 归零时标记 isDefeated）
      attackCurrentMonster(card.attackPower, card.id);

      // HP 条动画
      Animated.timing(hpBarAnim, {
        toValue: newPct,
        duration: 420,
        useNativeDriver: false,
      }).start();

      // 伤害数字
      showDamageNumber(isSkill);

      if (isSkill) {
        // 技能：冲击闪光 + 怪兽缩放 + 剧烈抖动
        Animated.sequence([
          Animated.timing(attackFlash, { toValue: 0.75, duration: 80,  useNativeDriver: true }),
          Animated.timing(attackFlash, { toValue: 0,    duration: 260, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.timing(monsterScale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
          shakeMonster(true),
          Animated.timing(monsterScale, { toValue: 1,    duration: 160, useNativeDriver: true }),
        ]).start();
      } else {
        shakeMonster(false).start();
      }

      // 动画播放完后决定下一步
      setTimeout(() => {
        if (newHP <= 0) {
          doMonsterDefeat(monster);
        } else {
          const freshCards = useAppStore.getState().cards.slice(0, 10);
          setCurrentCardIdx((prev) =>
            freshCards.length > 0 ? Math.min(prev, freshCards.length - 1) : 0
          );
          resetCardAnim();
          setIsAnimating(false);
        }
      }, isSkill ? 1050 : 820);
    };

    if (isSkill) {
      // 技能绝招：预闪光 → 卡牌缩放飞出 → 命中
      Animated.sequence([
        Animated.timing(attackFlash, { toValue: 0.62, duration: 140, useNativeDriver: true }),
        Animated.timing(attackFlash, { toValue: 0,    duration: 140, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(cardScale,   { toValue: 1.45,              duration: 210, useNativeDriver: true }),
          Animated.timing(cardTY,      { toValue: -SCREEN_H * 0.56, duration: 410, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 0,                 duration: 390, useNativeDriver: true }),
        ]),
      ]).start(afterFlyOut);
    } else {
      // 普通工具卡：简单飞出
      Animated.parallel([
        Animated.timing(cardTY,      { toValue: -SCREEN_H * 0.48, duration: 330, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0,                 duration: 310, useNativeDriver: true }),
      ]).start(afterFlyOut);
    }
  };

  // ---- 怪兽击倒动画 -------------------------------------------
  const doMonsterDefeat = (monster: Monster) => {
    Animated.sequence([
      Animated.timing(monsterScale, { toValue: 1.45, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(monsterScale, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(monsterTX,    { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start(() => {
      monsterScale.setValue(1);
      monsterTX.setValue(0);
      setDefeatedMonster({ ...monster });
      setShowDefeatedModal(true);
      resetCardAnim();
      setIsAnimating(false);
    });
  };

  // ---- 怪兽反击动画（仅视觉，不扣血）--------------------------
  const playCounterAttack = () => {
    setCounterVisible(true);
    Animated.sequence([
      Animated.timing(monsterTX, { toValue: -58, duration: 130, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue:  85, duration: 180, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue:   0, duration: 210, useNativeDriver: true }),
    ]).start(() => setTimeout(() => setCounterVisible(false), 700));

    Animated.sequence([
      Animated.timing(counterFlash, { toValue: 0.5, duration: 130, useNativeDriver: true }),
      Animated.timing(counterFlash, { toValue: 0,   duration: 320, useNativeDriver: true }),
    ]).start();
  };

  // ---- Callback refs（避免 PanResponder 捕获旧闭包）----------
  const isAnimatingRef = useRef(false);
  isAnimatingRef.current = isAnimating;

  // 每次渲染刷新回调 ref，保证使用最新 state
  const gestureRef = useRef({
    onSwipeUp:   () => {},
    onSwipeSide: (_dx: number) => {},
  });

  gestureRef.current = {
    onSwipeUp: () => {
      if (isAnimatingRef.current) return;
      const state     = useAppStore.getState();
      const freshCards = state.cards.slice(0, 10);
      const card       = freshCards[currentCardIdx] ?? freshCards[0];
      const actives    = state.monsters.filter((m) => !m.isDefeated);
      const monster    = actives[state.currentMonsterIndex] ?? actives[0];
      if (!card || !monster) return;
      performAttack(card, monster);
    },
    onSwipeSide: (dx: number) => {
      if (isAnimatingRef.current) return;
      Animated.parallel([
        Animated.timing(cardTX,      { toValue: dx > 0 ? 520 : -520, duration: 210, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0,                    duration: 210, useNativeDriver: true }),
      ]).start(() => {
        resetCardAnim();
        const freshLen = useAppStore.getState().cards.slice(0, 10).length;
        if (freshLen > 0) {
          setCurrentCardIdx((prev) => (prev + 1) % freshLen);
        }
        // 划走卡牌 → 怪兽反击！
        playCounterAttack();
      });
    },
  };

  // ---- PanResponder（只创建一次）------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimatingRef.current,
      onMoveShouldSetPanResponder:  (_, gs) =>
        !isAnimatingRef.current && (Math.abs(gs.dy) > 8 || Math.abs(gs.dx) > 8),
      onPanResponderMove: (_, gs) => {
        cardTX.setValue(gs.dx * 0.5);
        cardTY.setValue(gs.dy * 0.6);
      },
      onPanResponderRelease: (_, gs) => {
        const { dx, dy } = gs;
        if (dy < -60 && Math.abs(dx) < 70) {
          // 上滑：攻击
          gestureRef.current.onSwipeUp();
        } else if (Math.abs(dx) > 70 && dy > -50) {
          // 左右滑：切换 + 怪兽反击
          gestureRef.current.onSwipeSide(dx);
        } else {
          // 弹回
          Animated.parallel([
            Animated.spring(cardTX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(cardTY, { toValue: 0, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  // ---- 关闭击倒弹窗 -------------------------------------------
  const handleCloseDefeated = () => {
    setShowDefeatedModal(false);
    setDefeatedMonster(null);
    loadNextMonster();
    // 同步新怪兽 HP 条（Zustand 同步更新，直接读取）
    const state   = useAppStore.getState();
    const actives = state.monsters.filter((m) => !m.isDefeated);
    const next    = actives[state.currentMonsterIndex] ?? actives[0];
    if (next) hpBarAnim.setValue(next.currentHP / next.maxHP);
  };

  // ---- 渲染 ---------------------------------------------------
  const currentCard = displayCards[currentCardIdx] ?? displayCards[0] ?? null;
  const backCount   = Math.min(3, displayCards.length - 1);
  const hpPct       = currentMonster ? currentMonster.currentHP / currentMonster.maxHP : 0;
  const hpBarColor  = hpPct > 0.5 ? '#22C55E' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* ---- 顶栏 ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ 战斗场</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🃏 {displayCards.length} 张</Text>
        </View>
      </View>

      {/* ---- 怪兽区 ---- */}
      <View style={styles.monsterSection}>
        {currentMonster ? (
          <>
            <Text style={styles.challengeLabel}>挑战中</Text>

            {/* 怪兽 emoji + 伤害数字（绝对定位在同一容器） */}
            <View style={styles.monsterEmojiWrapper}>
              <Animated.View
                style={{ transform: [{ translateX: monsterTX }, { scale: monsterScale }] }}
              >
                <Text style={styles.monsterEmoji}>{currentMonster.icon}</Text>
              </Animated.View>

              {/* 浮动伤害数字 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.damageOverlay,
                  { opacity: damageOpacity, transform: [{ translateY: damageY }] },
                ]}
              >
                <Text
                  style={[
                    styles.damageText,
                    currentCard?.type === 'skill' && styles.damageTextSkill,
                  ]}
                >
                  -{damageValue}
                </Text>
              </Animated.View>
            </View>

            <Text style={styles.monsterName}>{currentMonster.name}</Text>

            {/* HP 条 */}
            <View style={styles.hpBarOuter}>
              <Animated.View
                style={[
                  styles.hpBarFill,
                  {
                    backgroundColor: hpBarColor,
                    width: hpBarAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.hpText}>
              ❤️ {currentMonster.currentHP} / {currentMonster.maxHP}
            </Text>

            <Text style={styles.rewardHint}>
              🏆 击倒奖励：{currentMonster.rewardIcon ?? '🎁'} {currentMonster.reward}
            </Text>

            {/* 反击提示气泡 */}
            {counterVisible && (
              <View style={styles.counterBubble}>
                <Text style={styles.counterBubbleText}>⚡ 怪兽攻击了你！</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.allDefeated}>
            <Text style={styles.allDefeatedIcon}>🏆</Text>
            <Text style={styles.allDefeatedText}>所有怪兽已击倒！</Text>
            <Text style={styles.allDefeatedHint}>等待家长配置新挑战~</Text>
          </View>
        )}
      </View>

      {/* ---- 分割线 ---- */}
      <View style={styles.divider} />

      {/* ---- 卡牌区 ---- */}
      <View style={styles.cardSection}>
        {displayCards.length === 0 ? (
          // 空卡牌状态
          <View style={styles.emptyCards}>
            <Text style={styles.emptyIcon}>🎒</Text>
            <Text style={styles.emptyText}>还没有卡牌！</Text>
            <Text style={styles.emptyHint}>先去完成任务获得攻击卡牌吧</Text>
            <TouchableOpacity
              style={styles.goTasksBtn}
              onPress={() => navigation.navigate('TaskHall')}
              activeOpacity={0.8}
            >
              <Text style={styles.goTasksBtnText}>去完成任务 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cardStackArea}>
              {/* 背景堆叠卡（仅视觉深度） */}
              {Array.from({ length: backCount }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.card,
                    styles.backCard,
                    {
                      bottom:   -(i + 1) * 9,
                      zIndex:   -(i + 1),
                      opacity:  0.62 - i * 0.16,
                      transform: [{ scale: 1 - (i + 1) * 0.045 }],
                    },
                  ]}
                />
              ))}

              {/* 当前卡牌（可交互） */}
              {currentCard && (
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.card,
                    {
                      backgroundColor: CARD_STYLE[currentCard.type].bg,
                      borderColor:     CARD_STYLE[currentCard.type].border,
                      zIndex: 10,
                      transform: [
                        { translateX: cardTX },
                        { translateY: cardTY },
                        { scale: cardScale },
                      ],
                      opacity: cardOpacity,
                    },
                  ]}
                >
                  {/* 可攻击徽章 */}
                  <View
                    style={[
                      styles.attackBadge,
                      { backgroundColor: CARD_STYLE[currentCard.type].header },
                    ]}
                  >
                    <Text style={styles.attackBadgeText}>✓ 可攻击</Text>
                  </View>

                  <Text style={styles.cardIcon}>{currentCard.icon}</Text>
                  <Text
                    style={[styles.cardAttackPower, { color: CARD_STYLE[currentCard.type].header }]}
                  >
                    ⚔️ {currentCard.attackPower}
                  </Text>
                  <Text style={styles.cardTaskName} numberOfLines={1}>
                    {currentCard.taskName}
                  </Text>
                  <Text style={[styles.cardTypeLabel, { color: CARD_STYLE[currentCard.type].header }]}>
                    {currentCard.type === 'skill' ? '✨ 技能绝招' : '🔧 工具卡'}
                  </Text>

                  <View style={styles.swipeHintRow}>
                    <Text style={styles.swipeHintUp}>↑ 上滑攻击</Text>
                  </View>
                </Animated.View>
              )}
            </View>

            <Text style={styles.cardCountText}>
              第 {currentCardIdx + 1} / {displayCards.length} 张 · 左右滑动切换
            </Text>
          </>
        )}
      </View>

      {/* ---- 全屏闪光层（pointerEvents none，不阻挡手势） ---- */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { backgroundColor: '#FFF59D', opacity: attackFlash }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { backgroundColor: '#EF4444', opacity: counterFlash }]}
      />

      {/* ---- 击倒庆祝弹窗 ---- */}
      <MonsterDefeatedModal
        visible={showDefeatedModal}
        monster={defeatedMonster}
        onClose={handleCloseDefeated}
      />
    </SafeAreaView>
  );
}

// ============================================================
// 样式
// ============================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F0',
  },

  // ---- 顶栏 ----
  header: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // ---- 怪兽区 ----
  monsterSection: {
    flex: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  challengeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  monsterEmojiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    width: 120,
  },
  monsterEmoji: {
    fontSize: 80,
  },
  damageOverlay: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    pointerEvents: 'none',
  } as any,
  damageText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#DC2626',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  damageTextSkill: {
    fontSize: 42,
    color: '#7C3AED',
  },
  monsterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
    marginBottom: 10,
  },
  hpBarOuter: {
    width: '85%',
    height: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 6,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  hpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  rewardHint: {
    fontSize: 13,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  counterBubble: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterBubbleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  allDefeated: {
    alignItems: 'center',
    gap: 8,
  },
  allDefeatedIcon: {
    fontSize: 64,
  },
  allDefeatedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  allDefeatedHint: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // ---- 分割线 ----
  divider: {
    height: 1,
    backgroundColor: '#FECACA',
    marginHorizontal: 20,
  },

  // ---- 卡牌区 ----
  cardSection: {
    flex: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  cardStackArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: 260,
    marginBottom: 14,
  },
  card: {
    position: 'absolute',
    width: 240,
    height: 170,
    borderRadius: 20,
    borderWidth: 2.5,
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 2,
  },
  backCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  attackBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  attackBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardIcon: {
    fontSize: 36,
  },
  cardAttackPower: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardTaskName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHintRow: {
    marginTop: 4,
  },
  swipeHintUp: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cardCountText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ---- 空卡牌 ----
  emptyCards: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  emptyHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  goTasksBtn: {
    marginTop: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 28,
  },
  goTasksBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ---- 闪光层 ----
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
