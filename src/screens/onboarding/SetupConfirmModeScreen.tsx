// Step 6/7 — 选择任务确认模式

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { TaskConfirmMode } from '../../store/types';

const MODES: {
  value: TaskConfirmMode;
  icon: string;
  title: string;
  desc: string;
  pros: string[];
  recommend: string;
  color: string;
}[] = [
  {
    value: 'auto',
    icon: '⚡',
    title: '自动确认',
    desc: '孩子点完成后立即获得卡牌',
    pros: ['即时反馈，孩子更兴奋', '操作流畅，无需等待', '适合家长陪伴时使用'],
    recommend: '推荐 5-6 岁 / 家长在旁',
    color: '#FF8C00',
  },
  {
    value: 'parent_confirm',
    icon: '👨‍👩‍👧',
    title: '家长确认',
    desc: '孩子提交后，家长确认才发卡',
    pros: ['确保孩子真实完成任务', '家长收到消息提醒', '适合独立使用时'],
    recommend: '推荐 3-4 岁 / 孩子独立用',
    color: '#4A6FA5',
  },
];

export default function SetupConfirmModeScreen({ navigation }: any) {
  const [mode, setMode] = useState<TaskConfirmMode>('auto');
  const { updateSettings } = useAppStore();

  const handleNext = () => {
    updateSettings({ taskConfirmMode: mode });
    navigation.navigate('SetupComplete');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.step}>6 / 7</Text>
      <Text style={styles.title}>⚙️ 任务确认方式</Text>
      <Text style={styles.subtitle}>之后可以在设置里随时更改</Text>

      <View style={styles.cards}>
        {MODES.map((m) => {
          const isSelected = mode === m.value;
          return (
            <TouchableOpacity
              key={m.value}
              style={[styles.card, isSelected && { borderColor: m.color, backgroundColor: m.color + '10' }]}
              onPress={() => setMode(m.value)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.modeIcon}>{m.icon}</Text>
                <View style={styles.cardTopText}>
                  <Text style={[styles.modeTitle, isSelected && { color: m.color }]}>{m.title}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, isSelected && { borderColor: m.color }]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: m.color }]} />}
                </View>
              </View>

              <View style={styles.prosBox}>
                {m.pros.map((p) => (
                  <Text key={p} style={styles.prosItem}>✓ {p}</Text>
                ))}
              </View>

              <View style={[styles.recommendBadge, { backgroundColor: m.color + '20' }]}>
                <Text style={[styles.recommendText, { color: m.color }]}>{m.recommend}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.nextBtn, { backgroundColor: mode === 'auto' ? '#FF8C00' : '#4A6FA5' }]} onPress={handleNext}>
        <Text style={styles.nextBtnText}>下一步 →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7', padding: 20, paddingTop: 52 },
  step: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF8C00', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 28 },
  cards: { gap: 16, marginBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    borderWidth: 2.5, borderColor: '#eee',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modeIcon: { fontSize: 32, marginRight: 12 },
  cardTopText: { flex: 1 },
  modeTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  modeDesc: { fontSize: 13, color: '#888' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  prosBox: { gap: 4, marginBottom: 12 },
  prosItem: { fontSize: 13, color: '#666' },
  recommendBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  recommendText: { fontSize: 12, fontWeight: '600' },
  nextBtn: { borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
