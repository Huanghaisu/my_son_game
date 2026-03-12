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
import { Colors, Shadow } from '../../constants/theme';

interface Props {
  onEnter: () => void;
  childName: string;
  childAvatar: string;
  monster: Monster | null;
}

export default function SplashScreen({ onEnter, childName, childAvatar: _childAvatar, monster }: Props) {
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
  const rotateAnim   = useRef(new Animated.Value(0)).current;   // 底座旋转

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

    // 提示文字（常驻 + 呼吸效果）
    const promptSeq = Animated.sequence([
      Animated.delay(1900),
      Animated.timing(promptOp, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(promptOp, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(promptOp, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ])
      ),
    ]);
    promptSeq.start();

    // 底座旋转循环
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
    );
    rotateLoop.start();

    return () => {
      promptSeq.stop();
      rotateLoop.stop();
    };
    // 取消 3 秒后自动进入，改为手动点击
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
          <StarItem key={i} x={s.x} y={s.y} size={s.size} delay={i * 200} />
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
            <View>
              <Text style={styles.title}>小勇者</Text>
              <Text style={styles.titleSub}>大冒险</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── 怪兽出场区域 ───────────────────────── */}
        <Animated.View
          style={[
            styles.monsterContainer,
            { transform: [{ scale: monsterScale }], opacity: monsterOp },
          ]}
        >
          {monster && (
            <Animated.View 
              style={[
                styles.magicCircle, 
                { 
                  transform: [{ rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) }] 
                }
              ]} 
            />
          )}

          <View style={styles.monsterCard}>
          {monster ? (
            <>
              {/* 怪兽图片或 emoji */}
              {monsterImageSource ? (
                <Image source={monsterImageSource} style={styles.monsterImage} resizeMode="contain" />
              ) : monster.imageUri ? (
                <Image source={{ uri: monster.imageUri }} style={styles.monsterImage} resizeMode="contain" />
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
          </View>
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

// ────────────────────────────────────────────────────────────
// 辅助组件：动态星星
// ────────────────────────────────────────────────────────────
function StarItem({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text 
      style={[
        styles.decorStar, 
        { left: x, top: y, fontSize: size, opacity }
      ]}
    >
      ✦
    </Animated.Text>
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
  { x: 180, y: 250, size: 12 },
  { x: 10,  y: 450, size: 6  },
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
    letterSpacing: 2,
    fontWeight: '600',
  },
  greetingName: {
    color: Colors.gold,
    fontWeight: '900',
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
    fontSize: 56,
    fontWeight: '900',
    color: Colors.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    letterSpacing: 6,
  },
  titleSub: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFA500',
    textAlign: 'center',
    textShadowColor: 'rgba(255,165,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    letterSpacing: 6,
    marginTop: -8,
  },
  // 怪兽卡片
  monsterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 220,
  },
  magicCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
    borderStyle: 'dashed',
  },
  monsterCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.35)',
    width: '75%',
    gap: 6,
    ...Shadow.lg,
  },
  monsterImage: {
    width: 110,
    height: 110,
    marginBottom: 4,
  },
  monsterEmoji: {
    fontSize: 68,
    marginBottom: 4,
  },
  monsterName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  challengeText: {
    fontSize: 14,
    color: 'rgba(255,200,100,0.95)',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 1.5,
    fontWeight: '600',
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
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 3,
    fontWeight: '700',
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
