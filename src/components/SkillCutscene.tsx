// ============================================================
// 必杀技演出组件
// 困难任务攻击时全屏展示：压暗 → 光环 → 赛罗冲入 → 冲刺 → 退场
// 父组件条件渲染（showSkillCutscene && <SkillCutscene>），onComplete 后卸载
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, Dimensions, Easing,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const HERO_IMAGE = require('../../assets/skills/hero_zero.png');

// 光环基础尺寸（scale 动画放大）
const RING_SIZE = 160;
const RING_CENTER_LEFT = SW / 2 - RING_SIZE / 2;
const RING_CENTER_TOP  = SH * 0.42 - RING_SIZE / 2;

// 英雄显示尺寸（原图 400×600 缩放）
const HERO_W = 210;
const HERO_H = 315;

interface Props {
  onComplete: () => void;
}

export default function SkillCutscene({ onComplete }: Props) {
  // 遮罩
  const overlayOp = useRef(new Animated.Value(0)).current;

  // 英雄核心
  const heroX      = useRef(new Animated.Value(-SW)).current;
  const heroOpReal = useRef(new Animated.Value(0)).current;
  const heroScl    = useRef(new Animated.Value(0.5)).current;
  const heroRot    = useRef(new Animated.Value(0)).current;       // 冲锋倾斜

  // 残影系统 (3层)
  const afterOp1 = useRef(new Animated.Value(0)).current;
  const afterOp2 = useRef(new Animated.Value(0)).current;
  const afterOp3 = useRef(new Animated.Value(0)).current;
  const afterX1  = useRef(new Animated.Value(0)).current;
  const afterX2  = useRef(new Animated.Value(0)).current;
  const afterX3  = useRef(new Animated.Value(0)).current;

  // 全屏震动
  const shakeX  = useRef(new Animated.Value(0)).current;
  const shakeY  = useRef(new Animated.Value(0)).current;

  // 技能文字
  const textScl = useRef(new Animated.Value(0)).current;
  const textOp  = useRef(new Animated.Value(0)).current;

  // 能量粒子 (蓄力)
  const particles = useRef([...Array(12)].map(() => ({
    x: new Animated.Value(Math.random() * SW),
    y: new Animated.Value(Math.random() * SH),
    op: new Animated.Value(0),
    scl: new Animated.Value(1),
  }))).current;

  // 冲击闪光
  const flashOp = useRef(new Animated.Value(0)).current;
  const burstScl = useRef(new Animated.Value(0)).current; // 冲击波

  useEffect(() => {
    // ── 1. 蓄力阶段：压暗 + 粒子汇聚 ────────────────
    Animated.timing(overlayOp, { toValue: 0.9, duration: 300, useNativeDriver: true }).start();

    // 粒子汇聚动画
    particles.forEach((p, i) => {
      const targetX = SW / 2;
      const targetY = SH / 2.2;
      Animated.sequence([
        Animated.delay(i * 30),
        Animated.parallel([
          Animated.timing(p.op, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.x,  { toValue: targetX, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.y,  { toValue: targetY, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.scl,{ toValue: 0.1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(p.op, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    });

    // ── 2. 英雄闪现登场 ─────────────────────────────
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.spring(heroX,   { toValue: SW * 0.15, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.timing(heroOpReal, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(heroScl, { toValue: 1.1, tension: 80, friction: 6, useNativeDriver: true }),
      ]),
      // 小幅度后撤蓄力
      Animated.timing(heroX, { toValue: SW * 0.05, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();

    // ── 3. 技能名霸气弹出 ──────────────────────────
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.spring(textScl, { toValue: 1.2, tension: 90, friction: 4, useNativeDriver: true }),
        Animated.timing(textOp,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.spring(textScl, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    // ── 4. 极速冲锋：残影 + 动态变形 ──────────────────
    Animated.sequence([
      Animated.delay(1400),
      // 开启残影
      Animated.parallel([
        Animated.timing(afterOp1, { toValue: 0.5, duration: 50, useNativeDriver: true }),
        Animated.timing(afterOp2, { toValue: 0.3, duration: 50, useNativeDriver: true }),
        Animated.timing(afterOp3, { toValue: 0.15, duration: 50, useNativeDriver: true }),
      ]),
      // 瞬间冲过屏幕
      Animated.parallel([
        Animated.timing(heroX,   { toValue: SW * 1.2, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(heroRot, { toValue: 0.15, duration: 100, useNativeDriver: true }),
        // 残影跟随 (带延迟)
        Animated.sequence([
          Animated.delay(40),
          Animated.parallel([
            Animated.timing(afterX1, { toValue: SW, duration: 400, useNativeDriver: true }),
            Animated.timing(afterOp1, { toValue: 0, duration: 450, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(80),
          Animated.parallel([
            Animated.timing(afterX2, { toValue: SW, duration: 400, useNativeDriver: true }),
            Animated.timing(afterOp2, { toValue: 0, duration: 450, useNativeDriver: true }),
          ]),
        ]),
      ]),
    ]).start();

    // ── 5. 冲击时刻：闪光 + 震动 + 冲击波 ────────────────
    Animated.sequence([
      Animated.delay(1650),
      // 全屏强闪
      Animated.parallel([
        Animated.timing(flashOp, { toValue: 1,  duration: 80,  useNativeDriver: true }),
        Animated.spring(burstScl,{ toValue: 8,  tension: 40, friction: 5, useNativeDriver: true }),
      ]),
      // 剧烈震动
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 18, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -18, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: 12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: -12, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]),
      Animated.timing(flashOp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // ── 6. 结束：回收资源并退出 ───────────────────
    Animated.sequence([
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(overlayOp, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(textOp,    { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onComplete());

  }, []);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateX: shakeX }, { translateY: shakeY }] }
      ]} 
      pointerEvents="none"
    >
      {/* 暗色遮罩 */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOp }]} />

      {/* 能量汇聚粒子 */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: p.x,
              top: p.y,
              opacity: p.op,
              transform: [{ scale: p.scl }],
            },
          ]}
        />
      ))}

      {/* 冲击波中心点 */}
      <Animated.View 
        style={[
          styles.burstRing, 
          { transform: [{ scale: burstScl }], opacity: flashOp }
        ]} 
      />

      {/* 技能文字 */}
      <Animated.View
        style={[
          styles.skillTextWrap,
          { opacity: textOp, transform: [{ scale: textScl }] },
        ]}
      >
        <Text style={styles.skillText}>⚡ 赛罗斩！</Text>
        <Text style={styles.skillSub}>ZERO SLASH</Text>
      </Animated.View>

      {/* 角色与残影 */}
      <View style={styles.heroStack}>
        {/* 残影 1 */}
        <Animated.Image
          source={HERO_IMAGE}
          style={[styles.hero, { position: 'absolute', opacity: afterOp1, transform: [{ translateX: afterX1 }, { scale: 1.05 }] }]}
          resizeMode="contain"
        />
        {/* 主要角色 */}
        <Animated.Image
          source={HERO_IMAGE}
          style={[
            styles.hero,
            {
              opacity: heroOpReal,
              transform: [
                { translateX: heroX },
                { scale: heroScl },
                { rotate: heroRot.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-15deg', '15deg']
                  })
                },
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* 冲击闪光层 */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOp }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlay: {
    backgroundColor: '#050010',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#A78BFA',
    borderRadius: 3,
  },
  burstRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#7C3AED',
    left: SW / 2 - 50,
    top: SH / 2.2 - 50,
  },
  skillTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SH * 0.16,
    alignItems: 'center',
    zIndex: 100,
  },
  skillText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
    letterSpacing: 4,
  },
  skillSub: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 8,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  heroStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SH * 0.22,
    height: HERO_H,
  },
  hero: {
    width: HERO_W,
    height: HERO_H,
  },
  flash: {
    backgroundColor: '#fff',
  },
});
