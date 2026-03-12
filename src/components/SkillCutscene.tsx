// ============================================================
// 必杀技演出组件
// 困难任务攻击时全屏展示：压暗 → 光环 → 赛罗冲入 → 冲刺 → 退场
// 父组件条件渲染（showSkillCutscene && <SkillCutscene>），onComplete 后卸载
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, Dimensions,
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

  // 三层光环
  const ring1S  = useRef(new Animated.Value(0.2)).current;
  const ring2S  = useRef(new Animated.Value(0.2)).current;
  const ring3S  = useRef(new Animated.Value(0.2)).current;
  const ring1Op = useRef(new Animated.Value(0.7)).current;
  const ring2Op = useRef(new Animated.Value(0.6)).current;
  const ring3Op = useRef(new Animated.Value(0.5)).current;

  // 英雄
  const heroX   = useRef(new Animated.Value(SW)).current;  // 从右侧进场
  const heroOp  = useRef(new Animated.Value(0)).current;
  const heroScl = useRef(new Animated.Value(0.85)).current;

  // 技能文字
  const textScl = useRef(new Animated.Value(0)).current;
  const textOp  = useRef(new Animated.Value(0)).current;

  // 冲击闪光
  const flashOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── 1. 遮罩压暗 ────────────────────────────
    Animated.timing(overlayOp, {
      toValue: 0.88, duration: 220, useNativeDriver: true,
    }).start();

    // ── 2. 三层光环向外扩散 ──────────────────────
    [
      [ring1S, ring1Op, 120],
      [ring2S, ring2Op, 220],
      [ring3S, ring3Op, 320],
    ].forEach(([s, op, delay]) => {
      Animated.sequence([
        Animated.delay(delay as number),
        Animated.parallel([
          Animated.timing(s as Animated.Value, { toValue: 4.5, duration: 700, useNativeDriver: true }),
          Animated.timing(op as Animated.Value, { toValue: 0,   duration: 700, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // ── 3. 英雄从右侧弹入 ────────────────────────
    Animated.sequence([
      Animated.delay(260),
      Animated.parallel([
        Animated.spring(heroX,  { toValue: 0, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(heroOp, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(heroScl,{ toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      ]),
    ]).start();

    // ── 4. 技能名称弹出 ──────────────────────────
    Animated.sequence([
      Animated.delay(560),
      Animated.parallel([
        Animated.spring(textScl, { toValue: 1, tension: 75, friction: 4, useNativeDriver: true }),
        Animated.timing(textOp,  { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
    ]).start();

    // ── 5. 英雄向左冲刺（攻击动作） ─────────────
    Animated.sequence([
      Animated.delay(970),
      Animated.timing(heroX, { toValue: -90, duration: 140, useNativeDriver: true }),
    ]).start();

    // ── 6. 冲击闪光（冲刺到位时） ────────────────
    Animated.sequence([
      Animated.delay(1070),
      Animated.timing(flashOp, { toValue: 0.7,  duration: 70,  useNativeDriver: true }),
      Animated.timing(flashOp, { toValue: 0,    duration: 260, useNativeDriver: true }),
    ]).start();

    // ── 7. 英雄退出 + 文字淡出 ───────────────────
    Animated.sequence([
      Animated.delay(1110),
      Animated.parallel([
        Animated.timing(heroX,  { toValue: SW,  duration: 260, useNativeDriver: true }),
        Animated.timing(heroOp, { toValue: 0,   duration: 200, useNativeDriver: true }),
        Animated.timing(textOp, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]),
    ]).start();

    // ── 8. 遮罩淡出 → 通知父组件 ─────────────────
    Animated.sequence([
      Animated.delay(1260),
      Animated.timing(overlayOp, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onComplete());

  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 暗色遮罩 */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOp }]} />

      {/* 三层扩散光环 */}
      {[
        { s: ring1S, op: ring1Op, color: '#A78BFA' },
        { s: ring2S, op: ring2Op, color: '#7C3AED' },
        { s: ring3S, op: ring3Op, color: '#C4B5FD' },
      ].map((r, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              borderColor: r.color,
              opacity: r.op,
              transform: [{ scale: r.s }],
            },
          ]}
        />
      ))}

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

      {/* 英雄角色 */}
      <Animated.Image
        source={HERO_IMAGE}
        style={[
          styles.hero,
          {
            opacity: heroOp,
            transform: [
              { translateX: heroX },
              { scale: heroScl },
            ],
          },
        ]}
        resizeMode="contain"
      />

      {/* 冲击闪光 */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOp }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlay: {
    backgroundColor: '#08001a',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    left: RING_CENTER_LEFT,
    top: RING_CENTER_TOP,
  },
  skillTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SH * 0.14,
    alignItems: 'center',
  },
  skillText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    letterSpacing: 3,
  },
  skillSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 6,
    marginTop: 4,
  },
  hero: {
    position: 'absolute',
    width: HERO_W,
    height: HERO_H,
    right: 0,
    bottom: SH * 0.20,
  },
  flash: {
    backgroundColor: '#7C3AED',
  },
});
