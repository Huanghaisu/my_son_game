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
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { Card, Monster } from '../../store/types';
import MonsterDefeatedModal from '../../components/MonsterDefeatedModal';
import { hapticMedium, hapticHeavy, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { playSound } from '../../utils/soundManager';
import BattleScene from '../../components/BattleScene';
import { Image } from 'react-native';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// 卡牌视觉风格
const CARD_STYLE = {
  tool: { bg: '#FFF7ED', border: '#F97316', header: '#EA580C' },
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
  const cardTX = useRef(new Animated.Value(0)).current;
  const cardTY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const monsterTX = useRef(new Animated.Value(0)).current;
  const monsterScale = useRef(new Animated.Value(1)).current;
  const idleAnimScale = useRef(new Animated.Value(1)).current; // 呼吸缩放
  const idleAnimY = useRef(new Animated.Value(0)).current; // 呼吸浮动

  const damageY = useRef(new Animated.Value(0)).current;
  const damageOpacity = useRef(new Animated.Value(0)).current;

  const swipeUpAnim = useRef(new Animated.Value(1)).current; // 指引箭头
  const swayAnim = useRef(new Animated.Value(0)).current; // 卡牌摇摆

  // 两层闪光：黄色（攻击）/ 红色（反击）
  const attackFlash = useRef(new Animated.Value(0)).current;
  const counterFlash = useRef(new Animated.Value(0)).current;

  const hpBarAnim = useRef(
    new Animated.Value(
      currentMonster ? currentMonster.currentHP / currentMonster.maxHP : 1
    )
  ).current;

  // ---- 呼吸动画与指引箭头 -------------------------------------
  useEffect(() => {
    // 怪兽呼吸循环
    const idleLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(idleAnimScale, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
          Animated.timing(idleAnimScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(idleAnimY, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(idleAnimY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ])
    );
    if (!isAnimating && currentMonster) idleLoop.start();
    else { idleAnimScale.setValue(1); idleAnimY.setValue(0); }

    // 箭头脉冲循环
    Animated.loop(
      Animated.sequence([
        Animated.timing(swipeUpAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(swipeUpAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // 卡牌微摇摆循环
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    return () => idleLoop.stop();
  }, [isAnimating, currentMonster?.id]);

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
      Animated.timing(monsterTX, { toValue: strong ? 28 : 11, duration: 65, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? -22 : -8, duration: 60, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? 18 : 6, duration: 55, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: 0, duration: 55, useNativeDriver: true }),
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

    const newHP = Math.max(0, monster.currentHP - card.attackPower);
    const newPct = newHP / monster.maxHP;
    const isSkill = card.type === 'skill';

    // 卡牌飞出后的统一回调：提交 store + 播放命中动效
    const afterFlyOut = () => {
      // 触觉 + 音效：普通卡中等冲击，技能卡重击
      if (isSkill) hapticHeavy(); else hapticMedium();
      playSound('monster_hit');

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
          Animated.timing(attackFlash, { toValue: 0.75, duration: 80, useNativeDriver: true }),
          Animated.timing(attackFlash, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.timing(monsterScale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
          shakeMonster(true),
          Animated.timing(monsterScale, { toValue: 1, duration: 160, useNativeDriver: true }),
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
        Animated.timing(attackFlash, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(cardScale, { toValue: 1.45, duration: 210, useNativeDriver: true }),
          Animated.timing(cardTY, { toValue: -SCREEN_H * 0.56, duration: 410, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 0, duration: 390, useNativeDriver: true }),
        ]),
      ]).start(afterFlyOut);
    } else {
      // 普通工具卡：简单飞出
      Animated.parallel([
        Animated.timing(cardTY, { toValue: -SCREEN_H * 0.48, duration: 330, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 310, useNativeDriver: true }),
      ]).start(afterFlyOut);
    }
  };

  // ---- 怪兽击倒动画 -------------------------------------------
  const doMonsterDefeat = (monster: Monster) => {
    hapticSuccess();
    playSound('monster_defeated');
    Animated.sequence([
      Animated.timing(monsterScale, { toValue: 1.45, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(monsterScale, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(monsterTX, { toValue: 0, duration: 380, useNativeDriver: true }),
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
    hapticWarning();
    setCounterVisible(true);
    Animated.sequence([
      Animated.timing(monsterTX, { toValue: -58, duration: 130, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: 85, duration: 180, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: 0, duration: 210, useNativeDriver: true }),
    ]).start(() => setTimeout(() => setCounterVisible(false), 700));

    Animated.sequence([
      Animated.timing(counterFlash, { toValue: 0.5, duration: 130, useNativeDriver: true }),
      Animated.timing(counterFlash, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  };

  // ---- Callback refs（避免 PanResponder 捕获旧闭包）----------
  const isAnimatingRef = useRef(false);
  isAnimatingRef.current = isAnimating;

  // 每次渲染刷新回调 ref，保证使用最新 state
  const gestureRef = useRef({
    onSwipeUp: () => { },
    onSwipeSide: (_dx: number) => { },
  });

  gestureRef.current = {
    onSwipeUp: () => {
      if (isAnimatingRef.current) return;
      const state = useAppStore.getState();
      const freshCards = state.cards.slice(0, 10);
      const card = freshCards[currentCardIdx] ?? freshCards[0];
      const actives = state.monsters.filter((m) => !m.isDefeated);
      const monster = actives[state.currentMonsterIndex] ?? actives[0];
      if (!card || !monster) return;
      playSound('attack');
      performAttack(card, monster);
    },
    onSwipeSide: (dx: number) => {
      if (isAnimatingRef.current) return;
      Animated.parallel([
        Animated.timing(cardTX, { toValue: dx > 0 ? 520 : -520, duration: 210, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 210, useNativeDriver: true }),
      ]).start(() => {
        resetCardAnim();
        const freshLen = useAppStore.getState().cards.slice(0, 10).length;
        if (freshLen > 0) {
          setCurrentCardIdx((prev) => (prev + 1) % freshLen);
        }
        // 划走卡牌 → 怪兽反击！
        playSound('monster_roar');
        playCounterAttack();
      });
    },
  };

  // ---- PanResponder（只创建一次）------------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimatingRef.current,
      onMoveShouldSetPanResponder: (_, gs) =>
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
    const state = useAppStore.getState();
    const actives = state.monsters.filter((m) => !m.isDefeated);
    const next = actives[state.currentMonsterIndex] ?? actives[0];
    if (next) hpBarAnim.setValue(next.currentHP / next.maxHP);
  };

  // ---- 渲染 ---------------------------------------------------
  const currentCard = displayCards[currentCardIdx] ?? displayCards[0] ?? null;
  const backCount = Math.min(3, displayCards.length - 1);
  const hpPct = currentMonster ? currentMonster.currentHP / currentMonster.maxHP : 0;
  const hpBarColor = hpPct > 0.5 ? '#22C55E' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* ---- 怪兽区 (全屏背景 + 绝对定位覆盖 UI) ---- */}
      <View style={styles.monsterSectionContainer}>
        <BattleScene>
          <View style={styles.monsterContentArea}>
            {currentMonster ? (
              <>
                {/* 移至上方的胶囊血条区 */}
                <View style={styles.monsterHeaderBlock}>
                  <Text style={styles.monsterName}>{currentMonster.name}</Text>
                  <View style={styles.hpBarOuter}>
                    <Animated.View
                      style={[
                        styles.hpBarFill,
                        {
                          backgroundColor: hpBarColor,
                          width: hpBarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hpText}>
                    HP: {currentMonster.currentHP} / {currentMonster.maxHP}
                  </Text>
                </View>

                {/* 巨型怪兽容器 */}
                <View style={styles.monsterEmojiWrapper}>
                  <Animated.View
                    style={{
                      transform: [
                        { translateX: monsterTX },
                        { scale: Animated.multiply(monsterScale, idleAnimScale) },
                        { translateY: idleAnimY }
                      ]
                    }}
                  >
                    {currentMonster.imageUri ? (
                      <Image source={{ uri: currentMonster.imageUri }} style={styles.monsterImage} />
                    ) : (
                      <Text style={styles.monsterEmoji}>{currentMonster.icon}</Text>
                    )}
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

                {/* 反击气泡 */}
                {counterVisible && (
                  <View style={styles.counterBubble}>
                    <Text style={styles.counterBubbleText}>⚡ 怪兽攻击！</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.allDefeated}>
                <Text style={styles.allDefeatedIcon}>🏆</Text>
                <Text style={styles.allDefeatedText}>怪兽全军覆没</Text>
              </View>
            )}
          </View>
        </BattleScene>
      </View>

      {/* 底部功能区 (叠加在背景之上) */}
      <View style={styles.bottomOverlay}>
        {/* ---- 顶栏状态区 (移至上方覆盖) ---- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚔️ 战斗场</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>🃏 {displayCards.length} 张</Text>
            {currentMonster && (
              <Text style={styles.rewardHintSmall}>
                奖励: {currentMonster.rewardIcon ?? '🎁'}
              </Text>
            )}
          </View>
        </View>

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
                        bottom: -(i + 1) * 9,
                        zIndex: -(i + 1),
                        opacity: 0.62 - i * 0.16,
                        transform: [{ scale: 1 - (i + 1) * 0.045 }],
                      },
                    ]}
                  />
                ))}

                {/* 当前卡牌（可交互） */}
                {currentCard && (() => {
                  const isEpic = currentCard.attackPower >= 10;
                  const isRare = currentCard.attackPower >= 6 && currentCard.attackPower < 10;
                  const style = CARD_STYLE[currentCard.type];

                  return (
                    <Animated.View
                      {...panResponder.panHandlers}
                      style={[
                        styles.card,
                        {
                          backgroundColor: style.bg,
                          borderColor: isEpic ? '#FFD700' : isRare ? '#A855F7' : style.border,
                          borderWidth: (isEpic || isRare) ? 3 : 2,
                          zIndex: 10,
                          transform: [
                            { translateX: cardTX },
                            { translateY: cardTY },
                            { scale: cardScale },
                            {
                              rotate: swayAnim.interpolate({
                                inputRange: [-1, 1],
                                outputRange: ['-1.5deg', '1.5deg']
                              })
                            }
                          ],
                          opacity: cardOpacity,
                          shadowColor: isEpic ? '#FFD700' : isRare ? '#A855F7' : '#000',
                          shadowRadius: isEpic ? 15 : isRare ? 8 : 10,
                          shadowOpacity: (isEpic || isRare) ? 0.6 : 0.2,
                        },
                      ]}
                    >
                      {/* 内发光边缘纹理 */}
                      <View style={styles.cardInnerHighlight} />

                      {/* 卡牌标题带 (三段式之首) */}
                      <View style={[styles.cardHeader, { backgroundColor: style.header }]}>
                        <Text style={styles.cardHeaderTitle}>
                          {currentCard.type === 'skill' ? '✨ 技能绝招' : '🔧 工具卡'}
                        </Text>
                        <View style={styles.rarityBadge}>
                          <Text style={styles.rarityBadgeText}>
                            {isEpic ? '💎' : isRare ? '✨' : '⭐'}
                          </Text>
                        </View>
                      </View>

                      {/* 中间图标区 (三段式之中) */}
                      <View style={styles.cardBody}>
                        <View style={styles.iconPlatform} />
                        <Text style={styles.cardIconLarge}>{currentCard.icon}</Text>

                        {/* 攻击力挂件 */}
                        <View style={[styles.powerTag, { backgroundColor: style.header }]}>
                          <Text style={styles.powerTagText}>攻击 {currentCard.attackPower}</Text>
                        </View>
                      </View>

                      {/* 底部描述区 (三段式之尾) */}
                      <View style={styles.cardFooter}>
                        <Text style={styles.footerTaskName} numberOfLines={1}>
                          {currentCard.taskName}
                        </Text>
                        <View style={styles.footerDivider} />
                        <Text style={styles.footerHint}>上划发动强力一击！</Text>
                      </View>

                      {/* 史诗级金光特效 */}
                      {isEpic && (
                        <Animated.View
                          style={[
                            styles.epicGlow,
                            {
                              opacity: swayAnim.interpolate({
                                inputRange: [-1, 0, 1],
                                outputRange: [0.3, 0.6, 0.3]
                              })
                            }
                          ]}
                        />
                      )}
                    </Animated.View>
                  );
                })()}
              </View>

              <Animated.View style={[styles.swipeHintRow, { opacity: swipeUpAnim }]}>
                <Text style={styles.swipeHintUp}>↑ 向上滑动发动攻击 ↑</Text>
              </Animated.View>
            </>
          )}
        </View>
      </View>

      {/* ---- 全屏闪光层 ---- */}
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'flex-end',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  rewardHintSmall: {
    color: '#FFD700',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
  },

  // ---- 怪兽区 (场景模式) ----
  monsterSectionContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  monsterContentArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '20%', // 避开顶栏
  },

  // 胶囊血条
  monsterHeaderBlock: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  monsterName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  hpBarOuter: {
    width: 140,
    height: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },

  // 巨型怪兽显示
  monsterEmojiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    width: 240,
  },
  monsterEmoji: {
    fontSize: 160,
  },
  monsterImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },

  damageOverlay: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    pointerEvents: 'none',
    zIndex: 20,
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
  counterBubble: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  counterBubbleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  allDefeated: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 30,
    borderRadius: 20,
  },
  allDefeatedIcon: {
    fontSize: 70,
    marginBottom: 10,
  },
  allDefeatedText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#DC2626',
  },

  // ---- 底部覆盖区 ----
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '42%',
    justifyContent: 'flex-end',
  },

  // ---- 卡牌区 ----
  cardSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
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
    height: 190,
    borderRadius: 20,
    borderWidth: 2,
    elevation: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  backCard: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },

  // 卡牌内发光细节
  cardInnerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    zIndex: 5,
    pointerEvents: 'none',
  },

  // 三段式：头部
  cardHeader: {
    height: 34,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  cardHeaderTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rarityBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadgeText: {
    fontSize: 12,
  },

  // 三段式：主体
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconPlatform: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    bottom: '20%',
  },
  cardIconLarge: {
    fontSize: 74,
    zIndex: 2,
  },
  powerTag: {
    position: 'absolute',
    right: 12,
    bottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  powerTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

  // 三段式：底部
  cardFooter: {
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerTaskName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  footerDivider: {
    height: 1.5,
    width: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginVertical: 4,
  },
  footerHint: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },

  // 史诗级光效应
  epicGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
    opacity: 0.1,
    zIndex: -1,
  },
  swipeHintRow: {
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  swipeHintUp: {
    fontSize: 15,
    color: '#FFD700',
    fontWeight: '900',
    letterSpacing: 1,
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
