// Step 5/7 — 配置第一只怪兽

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { MONSTER_TEMPLATES } from '../../constants/templates';
import { Monster } from '../../store/types';

type MonsterTemplate = Omit<Monster, 'id' | 'isDefeated' | 'currentHP'>;

export default function SetupMonsterScreen({ navigation }: any) {
  const [selected, setSelected] = useState<MonsterTemplate>(MONSTER_TEMPLATES[0]);
  const [customReward, setCustomReward] = useState('');
  const { addMonsterToQueue } = useAppStore();

  const reward = customReward.trim() || selected.reward;

  const handleNext = () => {
    addMonsterToQueue({
      name: selected.name,
      icon: selected.icon,
      maxHP: selected.maxHP,
      difficulty: selected.difficulty,
      reward,
      rewardIcon: selected.rewardIcon,
    });
    navigation.navigate('SetupConfirmMode');
  };

  const getDifficultyLabel = (d: Monster['difficulty']) =>
    ({ easy: '简单', normal: '普通', hard: '困难' }[d]);

  const getDifficultyColor = (d: Monster['difficulty']) =>
    ({ easy: '#27AE60', normal: '#F39C12', hard: '#E74C3C' }[d]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.step}>5 / 7</Text>
      <Text style={styles.title}>👾 选择第一只怪兽</Text>
      <Text style={styles.subtitle}>击倒怪兽可以获得现实奖励！</Text>

      {/* 当前选中预览 */}
      <View style={styles.preview}>
        <Text style={styles.previewIcon}>{selected.icon}</Text>
        <Text style={styles.previewName}>{selected.name}</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewHp}>❤️ HP {selected.maxHP}</Text>
          <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(selected.difficulty) }]}>
            <Text style={styles.diffText}>{getDifficultyLabel(selected.difficulty)}</Text>
          </View>
        </View>
        <Text style={styles.previewDays}>
          {selected.difficulty === 'easy' ? '约 1-2 天可击倒' : selected.difficulty === 'normal' ? '约 3-5 天可击倒' : '约 1 周可击倒'}
        </Text>
      </View>

      {/* 怪兽列表 */}
      <View style={styles.grid}>
        {MONSTER_TEMPLATES.map((m) => (
          <TouchableOpacity
            key={m.name}
            style={[styles.monsterBtn, selected.name === m.name && styles.monsterBtnSelected]}
            onPress={() => { setSelected(m); setCustomReward(''); }}
          >
            <Text style={styles.monsterIcon}>{m.icon}</Text>
            <Text style={styles.monsterName}>{m.name}</Text>
            <Text style={styles.monsterHp}>HP {m.maxHP}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 自定义奖励 */}
      <View style={styles.rewardSection}>
        <Text style={styles.rewardLabel}>🎁 击倒奖励</Text>
        <Text style={styles.rewardDefault}>默认：{selected.reward}</Text>
        <TextInput
          style={styles.rewardInput}
          value={customReward}
          onChangeText={setCustomReward}
          placeholder="或者输入自定义奖励（选填）"
          placeholderTextColor="#ccc"
          maxLength={30}
        />
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>下一步 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FFF8E7', padding: 20, paddingTop: 52 },
  step: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF8C00', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 20 },
  preview: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#FFD580',
    shadowColor: '#FF8C00', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  previewIcon: { fontSize: 64, marginBottom: 8 },
  previewName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  previewHp: { fontSize: 16, color: '#E74C3C', fontWeight: '600' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diffText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  previewDays: { fontSize: 13, color: '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  monsterBtn: {
    width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 10,
    alignItems: 'center', borderWidth: 2, borderColor: '#eee',
  },
  monsterBtnSelected: { borderColor: '#FF8C00', backgroundColor: '#FFF5E0' },
  monsterIcon: { fontSize: 28, marginBottom: 4 },
  monsterName: { fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 2 },
  monsterHp: { fontSize: 11, color: '#aaa' },
  rewardSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  rewardLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  rewardDefault: { fontSize: 14, color: '#FF8C00', marginBottom: 8 },
  rewardInput: {
    backgroundColor: '#F8F8F8', borderRadius: 10, padding: 12,
    fontSize: 15, borderWidth: 1.5, borderColor: '#FFD580', color: '#333',
  },
  nextBtn: { backgroundColor: '#FF8C00', borderRadius: 30, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
  nextBtnText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});
