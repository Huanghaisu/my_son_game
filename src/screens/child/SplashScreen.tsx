// ============================================================
// 游戏启动主题画面（A+C：孩子个人化 + 当前怪兽出场）
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableWithoutFeedback, StatusBar, Image,
} from 'react-native';
import { Monster } from '../../store/types';
import { getMonsterImage } from '../../constants/monsterThemes';

interface Props {
  onEnter: () => void;
  childName: string;
  childAvatar: string;
  monster: Monster | null;
}

export default function SplashScreen({ onEnter, childName, monster }: Props) {
  const bgGlow        = useRef(new Animated.Value(0)).current;
  const greetingOp   = useRef(new Animated.Value(0)).current;
  const greetingY    = useRef(new Animated.Value(-20)).current;
  const titleScale   = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const star1        = useRef(new Animated.Value(0)).current;
  const star2        = useRef(new Animated.Value(0)).current;
  const star3        = useRef(new Animated.Value(0)).current;
  const monsterScale = useRef(new Animated.Value(0)).current;
  const monsterOp    = useRef(new Animated.Value(0)).current;
  const challengeOp  = useRef(new Animated.Value(0)).current;
  const promptOp     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 背景渐亮
    Animated.timing(bgGlow, { toValue: 1, duration: 600, useNativeDriver: false }).start();

    // 问候语滑入
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(greetingOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(greetingY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // 标题弹出
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // 星星依次出现
    [star1, star2, star3].forEach((s, i) => {
      Animated.sequence([
        Animated.delay(800 + i * 150),
        Animated.spring(s, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
      ]).start();
    });

    // 怪兽弹入
    Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.spring(monsterScale, { toValue: 1, tension: 55, friction: 5, useNativeDriver: true }),
        Animated.timing(monsterOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // 挑战文字
    Animated.sequence([
      Animated.delay(1450),
      Animated.timing(challengeOp, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // 提示文字
    Animated.sequence([
      Animated.delay(1900),
      Animated.timing(promptOp, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // 3 秒后自动进入
    const timer = setTimeout(onEnter, 3000);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = bgGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#080820', '#12124a'],
  });

  const monsterImageSource = monster
    ? getMonsterImage(monster.themeId, monster.imageKey)
    : null;

  const displayName = childName?.trim() || '小勇者';

  return (
    <TouchableWithoutFeedback onPress={onEnter}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />

        {/* 装饰星点 */}
        {DECOR_STARS.map((s, i) => (
          <Text key={i} style={[styles.decorStar, { left: s.x, top: s.y, fontSize: s.size }]}>✦</Text>
        ))}

        {/* ── 问候语 ─────────────────────────────── */}
        <Animated.View
          style={[
            styles.greeting,
            { opacity: greetingOp, transform: [{ translateY: greetingY }] },
          ]}
        >
          <Text style={styles.greetingText}>
            欢迎回来，<Text style={styles.greetingName}>{displayName}</Text>！
          </Text>
        </Animated.View>

        {/* ── 标题 ───────────────────────────────── */}
        <View style={styles.titleArea}>
          <View style={styles.starRow}>
            {[star1, star2, star3].map((s, i) => (
              <Animated.Text key={i} style={[styles.bigStar, { transform: [{ scale: s }], opacity: s }]}>
                ⭐
              </Animated.Text>
            ))}
          </View>
          <Animated.View style={{ transform: [{ scale: titleScale }], opacity: titleOpacity }}>
            <Text style={styles.title}>小勇者</Text>
            <Text style={styles.titleSub}>大冒险</Text>
          </Animated.View>
        </View>

        {/* ── 怪兽出场区域 ───────────────────────── */}
        <Animated.View
          style={[
            styles.monsterCard,
            { transform: [{ scale: monsterScale }], opacity: monsterOp },
          ]}
        >
          {monster ? (
            <>
              {/* 怪兽图片或 emoji */}
              {monsterImageSource ? (
                <Image source={monsterImageSource} style={styles.monsterImage} resizeMode="contain" />
              ) : (
                <Text style={styles.monsterEmoji}>{monster.icon}</Text>
              )}

              {/* 挑战文字 */}
              <Animated.View style={{ opacity: challengeOp }}>
                <Text style={styles.monsterName}>{monster.name}</Text>
                <Text style={styles.challengeText}>正在等你挑战！</Text>
                <View style={styles.hpRow}>
                  <Text style={styles.hpLabel}>❤️</Text>
                  <View style={styles.hpBarBg}>
                    <View
                      style={[
                        styles.hpBarFill,
                        { width: `${Math.max(0, (monster.currentHP / monster.maxHP) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.hpNum}>{monster.currentHP}</Text>
                </View>
              </Animated.View>
            </>
          ) : (
            <>
              <Text style={styles.monsterEmoji}>🌟</Text>
              <Animated.View style={{ opacity: challengeOp }}>
                <Text style={styles.monsterName}>准备好了吗？</Text>
                <Text style={styles.challengeText}>完成任务，召唤怪兽！</Text>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* ── 底部提示 ───────────────────────────── */}
        <View style={styles.bottom}>
          <Animated.Text style={[styles.prompt, { opacity: promptOp }]}>
            轻触屏幕开始冒险
          </Animated.Text>
          <View style={styles.bottomIcons}>
            <Text style={styles.bottomEmoji}>⚔️</Text>
            <Text style={styles.bottomEmoji}>🛡️</Text>
            <Text style={styles.bottomEmoji}>✨</Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const DECOR_STARS = [
  { x: 20,  y: 60,  size: 10 },
  { x: 80,  y: 130, size: 7  },
  { x: 300, y: 80,  size: 12 },
  { x: 340, y: 190, size: 7  },
  { x: 50,  y: 310, size: 9  },
  { x: 318, y: 360, size: 7  },
  { x: 140, y: 560, size: 9  },
  { x: 255, y: 500, size: 7  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080820',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
    paddingBottom: 40,
  },
  decorStar: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.25)',
  },

  // 问候语
  greeting: {
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    fontWeight: '500',
  },
  greetingName: {
    color: '#FFD700',
    fontWeight: '800',
  },

  // 标题
  titleArea: {
    alignItems: 'center',
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  bigStar: {
    fontSize: 32,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
    letterSpacing: 4,
  },
  titleSub: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFA500',
    textAlign: 'center',
    textShadowColor: 'rgba(255,165,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    letterSpacing: 4,
    marginTop: -6,
  },

  // 怪兽卡片
  monsterCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    width: '80%',
    gap: 6,
  },
  monsterImage: {
    width: 120,
    height: 120,
    marginBottom: 4,
  },
  monsterEmoji: {
    fontSize: 72,
    marginBottom: 4,
  },
  monsterName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  challengeText: {
    fontSize: 15,
    color: 'rgba(255,200,100,0.9)',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1,
  },
  hpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  hpLabel: { fontSize: 13 },
  hpBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  hpNum: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    minWidth: 28,
    textAlign: 'right',
  },

  // 底部
  bottom: {
    alignItems: 'center',
    gap: 10,
  },
  prompt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  bottomIcons: {
    flexDirection: 'row',
    gap: 20,
  },
  bottomEmoji: {
    fontSize: 28,
    opacity: 0.55,
  },
});
