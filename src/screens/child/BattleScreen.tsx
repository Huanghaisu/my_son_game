// ============================================================
// 儿童端 — 战斗场（重构版）
// 卡牌来自任务状态：彩色(已完成)可攻击，灰色(未完成/已消耗)被反击
// 普通任务→普通攻击，困难任务→绝招攻击
// 动画：RN 内置 Animated + PanResponder
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
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { Task, Monster } from '../../store/types';
import MonsterDefeatedModal from '../../components/MonsterDefeatedModal';
import SkillCutscene from '../../components/SkillCutscene';
import { hapticMedium, hapticHeavy, hapticSuccess, hapticWarning } from '../../utils/haptics';
import { playSound } from '../../utils/soundManager';
import BattleScene from '../../components/BattleScene';
import { getMonsterImage } from '../../constants/monsterThemes';

const { height: SCREEN_H } = Dimensions.get('window');

// 卡牌视觉风格（彩色状态）
const CARD_STYLE = {
  normal: { bg: '#FFF7ED', border: '#F97316', header: '#EA580C' },
  hard:   { bg: '#F5F3FF', border: '#8B5CF6', header: '#7C3AED' },
} as const;

// 判断卡牌是否可用（彩色）
function isCardAvailable(task: Task): boolean {
  return task.status === 'completed' && !task.battleCardConsumed;
}

export default function BattleScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const monsterId: string = route.params?.monsterId;

  const { tasks, monsters, attackMonster } = useAppStore();

  // ---- 派生数据 ------------------------------------------------
  const monster = monsters.find((m) => m.id === monsterId && !m.isDefeated) ?? null;
  // 战斗卡牌 = 今日启用的任务，最多 10 张
  const battleCards = tasks.filter((t) => t.isEnabled).slice(0, 10);

  // ---- 局部状态 ------------------------------------------------
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [damageValue, setDamageValue] = useState(0);
  const [showDefeatedModal, setShowDefeatedModal] = useState(false);
  const [defeatedMonster, setDefeatedMonster] = useState<Monster | null>(null);
  const [counterVisible, setCounterVisible] = useState(false);
  const [showSkillCutscene, setShowSkillCutscene] = useState(false);
  // 绝招命中数据，cutscene 结束后取用
  const skillHitRef = useRef<{ defeated: boolean; newHpPct: number; mon: Monster } | null>(null);

  // ---- Animated 值 --------------------------------------------
  const cardTX = useRef(new Animated.Value(0)).current;
  const cardTY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const monsterTX = useRef(new Animated.Value(0)).current;
  const monsterScale = useRef(new Animated.Value(1)).current;
  const idleAnimScale = useRef(new Animated.Value(1)).current;
  const idleAnimY = useRef(new Animated.Value(0)).current;

  const damageY = useRef(new Animated.Value(0)).current;
  const damageOpacity = useRef(new Animated.Value(0)).current;

  const swipeUpAnim = useRef(new Animated.Value(1)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;

  const attackFlash = useRef(new Animated.Value(0)).current;
  const counterFlash = useRef(new Animated.Value(0)).current;

  const hpBarAnim = useRef(
    new Animated.Value(monster ? monster.currentHP / monster.maxHP : 1)
  ).current;

  // ---- 呼吸动画与指引箭头 -------------------------------------
  useEffect(() => {
    const idleLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(idleAnimScale, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
          Animated.timing(idleAnimScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(idleAnimY, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(idleAnimY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    if (!isAnimating && monster) idleLoop.start();
    else { idleAnimScale.setValue(1); idleAnimY.setValue(0); }

    Animated.loop(
      Animated.sequence([
        Animated.timing(swipeUpAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(swipeUpAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    return () => idleLoop.stop();
  }, [isAnimating, monster?.id]);

  // ---- 怪兽 HP 条同步 -----------------------------------------
  useEffect(() => {
    if (monster) {
      Animated.timing(hpBarAnim, {
        toValue: monster.currentHP / monster.maxHP,
        duration: 420,
        useNativeDriver: false,
      }).start();
    }
  }, [monster?.currentHP]);

  // ---- 卡牌索引边界保护 ---------------------------------------
  useEffect(() => {
    if (battleCards.length > 0 && currentCardIdx >= battleCards.length) {
      setCurrentCardIdx(battleCards.length - 1);
    }
  }, [battleCards.length]);

  // ---- 辅助函数 -----------------------------------------------
  const resetCardAnim = () => {
    cardTX.setValue(0);
    cardTY.setValue(0);
    cardOpacity.setValue(1);
    cardScale.setValue(1);
  };

  const shakeMonster = (strong: boolean) =>
    Animated.sequence([
      Animated.timing(monsterTX, { toValue: strong ? -28 : -11, duration: 55, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? 28 : 11, duration: 65, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? -22 : -8, duration: 60, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: strong ? 18 : 6, duration: 55, useNativeDriver: true }),
      Animated.timing(monsterTX, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]);

  const showDamageNumber = (isSkill: boolean) => {
    damageY.setValue(0);
    damageOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(damageY, { toValue: isSkill ? -115 : -75, duration: 900, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(isSkill ? 520 : 360),
        Animated.timing(damageOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  };

  // ---- 执行攻击 -----------------------------------------------
  const performAttack = (task: Task, mon: Monster) => {
    if (!isCardAvailable(task)) return;
    setIsAnimating(true);
    setDamageValue(task.attackPower);

    const newHP = Math.max(0, mon.currentHP - task.attackPower);
    const newPct = newHP / mon.maxHP;
    const isSkill = task.type === 'hard'; // 困难任务 = 绝招攻击

    const afterFlyOut = () => {
      // 提交到 store（绝招/普通都先算好结果）
      const defeated = attackMonster(mon.id, task.id);

      if (isSkill) {
        // 绝招：把命中数据存起来，等 cutscene 播完再呈现
        skillHitRef.current = { defeated, newHpPct: newPct, mon };
        resetCardAnim();
        setShowSkillCutscene(true);
      } else {
        // 普通攻击：立即呈现命中效果
        hapticMedium();
        playSound('attack');
        Animated.timing(hpBarAnim, { toValue: newPct, duration: 420, useNativeDriver: false }).start();
        showDamageNumber(false);
        shakeMonster(false).start();
        setTimeout(() => {
          if (defeated) { doMonsterDefeat(mon); }
          else { resetCardAnim(); setIsAnimating(false); }
        }, 820);
      }
    };

    if (isSkill) {
      // 绝招：预闪光 → 卡牌缩放飞出 → 命中
      Animated.sequence([
        Animated.timing(attackFlash, { toValue: 0.62, duration: 140, useNativeDriver: true }),
        Animated.timing(attackFlash, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(cardScale, { toValue: 1.45, duration: 180, useNativeDriver: true }),
          Animated.timing(cardTY, { toValue: -SCREEN_H * 0.56, duration: 320, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(afterFlyOut);
    } else {
      Animated.parallel([
        Animated.timing(cardTY, { toValue: -SCREEN_H * 0.48, duration: 260, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start(afterFlyOut);
    }
  };

  // ---- 绝招 cutscene 结束：呈现命中效果 ----------------------
  const handleSkillCutsceneComplete = () => {
    setShowSkillCutscene(false);
    const data = skillHitRef.current;
    if (!data) return;
    skillHitRef.current = null;

    hapticHeavy();
    playSound('attack');
    Animated.timing(hpBarAnim, { toValue: data.newHpPct, duration: 420, useNativeDriver: false }).start();
    showDamageNumber(true);
    Animated.sequence([
      Animated.timing(attackFlash, { toValue: 0.75, duration: 80,  useNativeDriver: true }),
      Animated.timing(attackFlash, { toValue: 0,    duration: 260, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(monsterScale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
      shakeMonster(true),
      Animated.timing(monsterScale, { toValue: 1,    duration: 160, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      if (data.defeated) { doMonsterDefeat(data.mon); }
      else { setIsAnimating(false); }
    }, 1050);
  };

  // ---- 怪兽击倒动画 -------------------------------------------
  const doMonsterDefeat = (mon: Monster) => {
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
      setDefeatedMonster({ ...mon });
      setShowDefeatedModal(true);
      resetCardAnim();
      setIsAnimating(false);
    });
  };

  // ---- 怪兽反击（仅视觉）-------------------------------------
  const playCounterAttack = () => {
    hapticWarning();
    playSound('monster_roar');
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

  // ---- Callback refs（避免 stale closure）--------------------
  const isAnimatingRef = useRef(false);
  isAnimatingRef.current = isAnimating;

  const gestureRef = useRef({
    onSwipeUp: () => {},
    onSwipeSide: (_dx: number) => {},
  });

  gestureRef.current = {
    onSwipeUp: () => {
      if (isAnimatingRef.current) return;
      const state = useAppStore.getState();
      const freshCards = state.tasks.filter((t) => t.isEnabled).slice(0, 10);
      const task = freshCards[currentCardIdx] ?? freshCards[0];
      const mon = state.monsters.find((m) => m.id === monsterId && !m.isDefeated);
      if (!task || !mon) return;

      if (!isCardAvailable(task)) {
        // 灰色卡牌：上划无效，提示怪兽嘲讽
        playCounterAttack();
        return;
      }
      performAttack(task, mon);
    },
    onSwipeSide: (dx: number) => {
      if (isAnimatingRef.current) return;
      Animated.parallel([
        Animated.timing(cardTX, { toValue: dx > 0 ? 520 : -520, duration: 210, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 210, useNativeDriver: true }),
      ]).start(() => {
        resetCardAnim();
        const freshCards = useAppStore.getState().tasks.filter((t) => t.isEnabled).slice(0, 10);
        if (freshCards.length > 0) {
          const nextIdx = (currentCardIdx + 1) % freshCards.length;
          setCurrentCardIdx(nextIdx);
          const nextCard = freshCards[nextIdx];
          // 翻到灰色卡牌 → 怪兽反击
          if (!nextCard || !isCardAvailable(nextCard)) {
            playCounterAttack();
          }
        }
      });
    },
  };

  // ---- PanResponder（只创建一次）-----------------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimatingRef.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        !isAnimatingRef.current && (Math.abs(gs.dy) > 8 || Math.abs(gs.dx) > 8),
      onPanResponderMove: (_, gs) => {
        cardTX.setValue(gs.dx * 0.5);
        cardTY.setValue(gs.dy * 0.9); // 提高灵敏度，更贴手
      },
      onPanResponderRelease: (_, gs) => {
        const { dx, dy } = gs;
        if (dy < -35 && Math.abs(dx) < 80) { // 降低判定阈值，缩短动作路径
          gestureRef.current.onSwipeUp();
        } else if (Math.abs(dx) > 70 && dy > -40) {
          gestureRef.current.onSwipeSide(dx);
        } else {
          Animated.parallel([
            Animated.spring(cardTX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(cardTY, { toValue: 0, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  // ---- 关闭击倒弹窗，返回怪兽选择 ----------------------------
  const handleCloseDefeated = () => {
    setShowDefeatedModal(false);
    setDefeatedMonster(null);
    navigation.goBack(); // 返回 MonsterSelectScreen
  };

  // ---- 渲染 ---------------------------------------------------
  const currentCard = battleCards[currentCardIdx] ?? battleCards[0] ?? null;
  const backCount = Math.min(3, battleCards.length - 1);
  const hpPct = monster ? monster.currentHP / monster.maxHP : 0;
  const hpBarColor = hpPct > 0.5 ? '#22C55E' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
  const monsterImage = monster ? getMonsterImage(monster.themeId, monster.imageKey) : null;

  const available = currentCard ? isCardAvailable(currentCard) : false;
  const style = currentCard ? CARD_STYLE[currentCard.type] : CARD_STYLE.normal;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* ---- 全屏怪兽场景背景 ---- */}
      <View style={styles.monsterSectionContainer}>
        <BattleScene>
          <View style={styles.monsterContentArea}>
            {monster ? (
              <>
                {/* 胶囊血条区 */}
                <View style={styles.monsterHeaderBlock}>
                  <Text style={styles.monsterName}>{monster.name}</Text>
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
                    HP {monster.currentHP} / {monster.maxHP}
                  </Text>
                </View>

                {/* 怪兽形象 */}
                <View style={styles.monsterEmojiWrapper}>
                  <Animated.View
                    style={{
                      transform: [
                        { translateX: monsterTX },
                        { scale: Animated.multiply(monsterScale, idleAnimScale) },
                        { translateY: idleAnimY },
                      ],
                    }}
                  >
                    {monsterImage ? (
                      <Image source={monsterImage} style={styles.monsterImage} />
                    ) : monster.imageUri ? (
                      <Image source={{ uri: monster.imageUri }} style={styles.monsterImage} />
                    ) : (
                      <Text style={styles.monsterEmoji}>{monster.icon}</Text>
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
                        currentCard?.type === 'hard' && styles.damageTextSkill,
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
                <Text style={styles.allDefeatedText}>怪兽已被击倒</Text>
              </View>
            )}
          </View>
        </BattleScene>
      </View>

      {/* ---- 底部卡牌区（叠加在背景上）---- */}
      <View style={styles.bottomOverlay}>
        {/* 顶栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ 换怪兽</Text>
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              🃏 {battleCards.filter(isCardAvailable).length}/{battleCards.length}
            </Text>
            {monster && (
              <Text style={styles.rewardHintSmall}>
                奖励: {monster.rewardIcon ?? '🎁'}
              </Text>
            )}
          </View>
        </View>

        {/* 卡牌区 */}
        <View style={styles.cardSection}>
          {battleCards.length === 0 ? (
            <View style={styles.emptyCards}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>还没有配置任务！</Text>
              <Text style={styles.emptyHint}>请让爸爸妈妈添加任务</Text>
            </View>
          ) : (
            <>
              <View style={styles.cardStackArea}>
                {/* 背景堆叠卡 */}
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
                {currentCard && (
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.card,
                      {
                        backgroundColor: available ? style.bg : '#E5E7EB',
                        borderColor: available ? style.border : '#9CA3AF',
                        borderWidth: 2,
                        zIndex: 10,
                        opacity: available ? cardOpacity : Animated.multiply(cardOpacity, 0.7 as any),
                        transform: [
                          { translateX: cardTX },
                          { translateY: cardTY },
                          { scale: cardScale },
                          {
                            rotate: swayAnim.interpolate({
                              inputRange: [-1, 1],
                              outputRange: ['-1.5deg', '1.5deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {/* 卡牌头部 */}
                    <View
                      style={[
                        styles.cardHeader,
                        { backgroundColor: available ? style.header : '#6B7280' },
                      ]}
                    >
                      <Text style={styles.cardHeaderTitle}>
                        {available
                          ? currentCard.type === 'hard' ? '⚡ 绝招攻击' : '🗡️ 普通攻击'
                          : currentCard.type === 'hard' ? '🔒 困难任务' : '🔒 普通任务'
                        }
                      </Text>
                      <Text style={styles.cardIndexText}>
                        {currentCardIdx + 1}/{battleCards.length}
                      </Text>
                    </View>

                    {/* 卡牌主体 */}
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardIconLarge, !available && styles.cardIconGray]}>
                        {currentCard.icon}
                      </Text>
                      {available && (
                        <View style={[styles.powerTag, { backgroundColor: style.header }]}>
                          <Text style={styles.powerTagText}>
                            攻击 {currentCard.attackPower}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 卡牌底部 */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.footerTaskName} numberOfLines={1}>
                        {currentCard.name}
                      </Text>
                      <View style={styles.footerDivider} />
                      <Text style={styles.footerHint}>
                        {available ? '↑ 上划发动攻击！' : '⏳ 完成任务后点亮'}
                      </Text>
                    </View>

                    {/* 灰色遮罩 */}
                    {!available && <View style={styles.grayMask} />}
                  </Animated.View>
                )}
              </View>

              <Animated.View style={[styles.swipeHintRow, { opacity: swipeUpAnim }]}>
                <Text style={styles.swipeHintUp}>
                  {available ? '↑ 向上滑动发动攻击 ↑' : '← 左右滑动换卡 →'}
                </Text>
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

      {/* ---- 必杀技演出（困难任务专属） ---- */}
      {showSkillCutscene && (
        <SkillCutscene onComplete={handleSkillCutsceneComplete} />
      )}
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
  monsterSectionContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  monsterContentArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '20%',
  },

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
  },

  damageOverlay: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
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

  // 底部覆盖区
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '44%',
    justifyContent: 'flex-end',
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
  },
  cardIndexText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },

  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardIconLarge: {
    fontSize: 64,
    zIndex: 2,
  },
  cardIconGray: {
    opacity: 0.4,
  },
  powerTag: {
    position: 'absolute',
    right: 12,
    bottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  powerTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },

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

  // 灰色遮罩
  grayMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(100,100,100,0.25)',
    zIndex: 5,
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

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
